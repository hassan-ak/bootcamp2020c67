# Step20-02 Choice

## Steps to code

1. Create new directory using `mkdir step02_choice_part1`.
2. Navigate to newly created directory using `cd step02_choice_part1`
3. Create cdk app using `cdk init app --language typescript`
4. Use `npm run watch` to auto transpile the code
5. Install DDB in the app using `npm i @aws-cdk/aws-dynamodb`. Update "./lib/step02_choice_part1-stack.ts" to create ddb table as it is going to be used in one of the lambda function

   ```js
   import * as ddb from '@aws-cdk/aws-dynamodb';
   const DynamoTable = new ddb.Table(this, 'DynamoTable', {
     partitionKey: {
       name: 'id',
       type: ddb.AttributeType.STRING,
     },
   });
   ```

6. Install Lambda function in the app using `npm i @aws-cdk/aws-lambda`. Update "./lib/step02_choice_part1-stack.ts" to create lambda functions and grand ddb acces to the function along with set environment variables

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

7. Create "./lambda/addData" to define handler code for the lambda function

   ```js
   const { DynamoDB } = require('aws-sdk');
   exports.handler = async () => {
     const dynamo = new DynamoDB();
     var generateId = Date.now();
     var idString = generateId.toString();
     const params = {
       TableName: process.env.DynamoTable,
       Item: {
         id: { S: idString },
         message: { S: 'New Entry Added' },
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

8. Install step function task in the app using `npm i @aws-cdk/aws-stepfunctions-tasks`. Update "./lib/step02_choice_part1-stack.ts" and create steps

   ```js
   import * as stepFunctionTasks from '@aws-cdk/aws-stepfunctions-tasks';
   const lambdafn = new stepFunctionTasks.LambdaInvoke(
     this,
     'Invoke addData lambda',
     {
       lambdaFunction: addData,
     }
   );
   ```

9. Install step function in the app using `npm i @aws-cdk/aws-stepfunctions`. Update "./lib/step02_choice_part1-stack.ts" and create succeed and fail step function

   ```js
   import * as stepFunctions from '@aws-cdk/aws-stepfunctions';
   const success = new stepFunctions.Succeed(this, 'We did it!');
   const jobFailed = new stepFunctions.Fail(this, 'Job Failed', {
     cause: 'Lambda Job Failed',
     error: 'could not add data to the dynamoDb',
   });
   ```

10. Update "./lib/step02_choice_part1-stack.ts" and create choice step function

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

11. Update "./lib/step02_choice_part1-stack.ts" and create chain and state machine

    ```js
    const chain = stepFunctions.Chain.start(lambdafn).next(choice);
    new stepFunctions.StateMachine(this, 'choiceStateMachine', {
      definition: chain,
    ```

12. Deploy the app using `cdk deploy`
13. From the console of the step function run tests.
14. Destroy the app using `cdk destroy`
