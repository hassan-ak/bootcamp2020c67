# Step20-06 Invoke Step Function with Event

## Steps to code

1. Create new directory using `mkdir step06_invoke_step_function_with_event`.
2. Navigate to newly created directory using `cd step06_invoke_step_function_with_event`
3. Create cdk app using `cdk init app --language typescript`
4. Use `npm run watch` to auto transpile the code
5. Install AppSync in the app using `npm i @aws-cdk/aws-appsync`. Update "./lib/step06_invoke_step_function_with_event-stack.ts" to create an appsync api.

   ```js
   import * as appsync from '@aws-cdk/aws-appsync';
   const api = new appsync.GraphqlApi(this, 'Api', {
     name: 'appsyncEventbridgeAPI',
     schema: appsync.Schema.fromAsset('schema/schema.graphql'),
     authorizationConfig: {
       defaultAuthorization: {
         authorizationType: appsync.AuthorizationType.API_KEY,
       },
     },
     logConfig: { fieldLogLevel: appsync.FieldLogLevel.ALL },
     xrayEnabled: true,
   });
   ```

6. Create "./schema/schema.graphql" to define schema for the app sync api

   ```gql
   type Event {
     result: String
   }
   type Query {
     getEvent: [Event]
   }
   type Mutation {
     createEvent(event: String!): Event
   }
   ```

7. Install events using `npm i @aws-cdk/aws-events` Update "./lib/step06_invoke_step_function_with_event-stack.ts" to create a http data source for the api and grant permission to put events on the event bus

   ```js
   import * as events from '@aws-cdk/aws-events';
   const httpDs = api.addHttpDataSource(
     'ds',
     'https://events.' + this.region + '.amazonaws.com/', // This is the ENDPOINT for eventbridge.
     {
       name: 'httpDsWithEventBridge',
       description: 'From Appsync to Eventbridge',
       authorizationConfig: {
         signingRegion: this.region,
         signingServiceName: 'events',
       },
     }
   );
   events.EventBus.grantAllPutEvents(httpDs);
   ```

8. Update "./lib/step06_invoke_step_function_with_event-stack.ts" to create resolver

   ```js
   const putEventResolver = httpDs.createResolver({
     typeName: 'Mutation',
     fieldName: 'createEvent',
     requestMappingTemplate: appsync.MappingTemplate.fromFile('request.vtl'),
     responseMappingTemplate: appsync.MappingTemplate.fromFile('response.vtl'),
   });
   ```

9. Create "request.vtl" and "response.vtl"

   ```vtl
   {
     "version": "2018-05-29",
     "method": "POST",
     "resourcePath": "/",
     "params": {
       "headers": {
         "content-type": "application/x-amz-json-1.1",
         "x-amz-target":"AWSEvents.PutEvents"
       },
       "body": {
         "Entries":[
           {
             "Source":"appsync-events",
             "EventBusName": "default",
             "Detail":"{ \"event\": \"$ctx.arguments.event\"}",
             "DetailType":"Event Bridge via GraphQL"
           }
         ]
       }
     }
   }
   ```

   ```vtl
   #if($ctx.error)
     $util.error($ctx.error.message, $ctx.error.type)
   #end
   #if($ctx.result.statusCode == 200)
     {
       "result": "$util.parseJson($ctx.result.body)"
     }
   #else
     $utils.appendError($ctx.result.body, $ctx.result.statusCode)
   #end
   ```

10. Install DDB using `npm i @aws-cdk/aws-events` Update "./lib/step06_invoke_step_function_with_event-stack.ts" to create ddb table

    ```js
    import * as ddb from '@aws-cdk/aws-dynamodb';
    const DynamoTable = new ddb.Table(this, 'DynamoTable', {
      partitionKey: {
        name: 'id',
        type: ddb.AttributeType.STRING,
      },
    });
    ```

11. Install lambda using `npm i @aws-cdk/lambda` Update "./lib/step06_invoke_step_function_with_event-stack.ts" to create a lambda function and grant access for ddb table

    ```js
    import * as lambda from '@aws-cdk/aws-lambda';
    const addData = new lambda.Function(this, 'addData', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'addData.handler',
    });
    DynamoTable.grantFullAccess(addData);
    addData.addEnvironment('DynamoTable', DynamoTable.tableName);
    ```

12. Create "lambda/addData.ts" to define lmabda handler

    ```js
    const { DynamoDB } = require('aws-sdk');

    exports.handler = async (event: any) => {
      const dynamo = new DynamoDB();

      var generateId = Date.now();
      var idString = generateId.toString();

      const params = {
        TableName: process.env.DynamoTable,
        Item: {
          id: { S: idString },
          message: { S: event.detail.event },
        },
      };
      try {
        await dynamo.putItem(params).promise();
        return { operationSuccessful: true };
      } catch (err) {
        console.log('DynamoDB error: ', err);
        return { operationSuccessful: false };
      }
    };
    ```

13. Install stepFunction tasks using `npm i @aws-cdk/aws-stepfunctions-tasks` Update "./lib/step06_invoke_step_function_with_event-stack.ts" to create step for the lambda function

    ```js
    import * as stepFunctionTasks from '@aws-cdk/aws-stepfunctions-tasks';
    const firstStep = new stepFunctionTasks.LambdaInvoke(
      this,
      'Invoke addData lambda',
      {
        lambdaFunction: addData,
      }
    );
    ```

14. Install stepFunction using `npm i @aws-cdk/aws-stepfunctions` Update "./lib/step06_invoke_step_function_with_event-stack.ts" and define states

    ```js
    import * as stepFunctions from '@aws-cdk/aws-stepfunctions';
    const pass = new stepFunctions.Pass(this, 'Pass', {
      result: stepFunctions.Result.fromObject({ triggerTime: 2 }),
      resultPath: '$.passObject',
    });
    const wait = new stepFunctions.Wait(this, 'Wait For Trigger Time', {
      time: stepFunctions.WaitTime.secondsPath('$.passObject.triggerTime'),
    });
    const success = new stepFunctions.Succeed(this, 'Job Successful');
    const jobFailed = new stepFunctions.Fail(this, 'Job Failed', {
      cause: 'Lambda Job Failed',
      error: 'could not add data to the dynamoDb',
    });
    ```

15. Update "./lib/step06_invoke_step_function_with_event-stack.ts" and define choice states

    ```js
    const choice = new stepFunctions.Choice(this, 'operation successful?');
    choice.when(
      stepFunctions.Condition.booleanEquals(
        '$.Payload.operationSuccessful',
        true
      ),
      success
    );
    choice.when(
      stepFunctions.Condition.booleanEquals(
        '$.Payload.operationSuccessful',
        false
      ),
      jobFailed
    );
    ```

16. Update "./lib/step06_invoke_step_function_with_event-stack.ts" to define chain and state machine

    ```js
    const chain = stepFunctions.Chain.start(firstStep)
      .next(pass)
      .next(wait)
      .next(choice);
    const stepFn = new stepFunctions.StateMachine(
      this,
      'stateMachineEventDriven',
      {
        definition: chain,
      }
    );
    ```

17. Install targets using `npm i @aws-cdk/aws-events-targets` and update "" to define rule for invoking lambda function and add rule to the step function

    ```js
    import targets = require('@aws-cdk/aws-events-targets');
    const rule = new events.Rule(this, 'AppSyncStepFnRule', {
      eventPattern: {
        source: ['appsync-events'],
      },
    });
    rule.addTarget(new targets.SfnStateMachine(stepFn));
    ```

18. Deploy the app using `cdk deploy`
19. Destroy the app using `cdk destroy`
