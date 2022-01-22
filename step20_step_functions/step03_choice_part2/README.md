# Step20-03 Choice

## Steps to code

1. Create new directory using `mkdir step03_choice_part2`.
2. Navigate to newly created directory using `cd step03_choice_part2`
3. Create cdk app using `cdk init app --language typescript`
4. Use `npm run watch` to auto transpile the code
5. Install DDB in the app using `npm i @aws-cdk/aws-dynamodb`. Update "./lib/step03_choice_part2-stack.ts" to create ddb table as it is going to be used in one of the lambda function

   ```js
   import * as ddb from '@aws-cdk/aws-dynamodb';
   const DynamoTable = new ddb.Table(this, 'DynamoTable', {
     partitionKey: {
       name: 'id',
       type: ddb.AttributeType.STRING,
     },
   });
   ```

6. Install Lambda function in the app using `npm i @aws-cdk/aws-lambda`. Update "./lib/step03_choice_part2-stack.ts" to create lambda functions and grand ddb acces to the function along with set environment variables

   ```js
   import * as lambda from '@aws-cdk/aws-lambda';
   const addData = new lambda.Function(this, 'addData', {
     runtime: lambda.Runtime.NODEJS_14_X,
     code: lambda.Code.fromAsset('lambda'),
     handler: 'addData.handler',
   });
   const addDataFailed = new lambda.Function(this, 'addDataFailed', {
     runtime: lambda.Runtime.NODEJS_14_X,
     code: lambda.Code.fromAsset('lambda'),
     handler: 'addDataFailed.handler',
   });
   const addDataSuccess = new lambda.Function(this, 'addDataSuccess', {
     runtime: lambda.Runtime.NODEJS_14_X,
     code: lambda.Code.fromAsset('lambda'),
     handler: 'addDataSuccess.handler',
   });
   DynamoTable.grantFullAccess(addData);
   addData.addEnvironment('DynamoTable', DynamoTable.tableName);
   ```

7. Create "./lambda/addData.ts", "./lambda/addDataFailed.ts" and "./lambda/addDataSuccess.ts" to define handler code for the lambda function

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

   ```js
   exports.handler = async () => {
     console.log('operation successful');
   };
   ```

   ```js
   exports.handler = async () => {
     console.log('operation failed');
   };
   ```

8. Install step function task in the app using `npm i @aws-cdk/aws-stepfunctions-tasks`. Update "./lib/step03_choice_part2-stack.ts" and create steps

   ```js
   import * as stepFunctionTasks from '@aws-cdk/aws-stepfunctions-tasks';
   const addDataInvoke = new stepFunctionTasks.LambdaInvoke(
     this,
     'Invoke addData lambda',
     {
       lambdaFunction: addData,
     }
   );
   const addDataFailedInvoke = new stepFunctionTasks.LambdaInvoke(this, 'No', {
     lambdaFunction: addDataFailed,
   });
   const addDataSuccessInvoke = new stepFunctionTasks.LambdaInvoke(
     this,
     'Yes',
     {
       lambdaFunction: addDataSuccess,
     }
   );
   ```

9. Install step function in the app using `npm i @aws-cdk/aws-stepfunctions`. Update "./lib/step03_choice_part2-stack.ts" and create pass step functions

   ```js
   import * as stepFunctions from '@aws-cdk/aws-stepfunctions';
   const otherwisePass = new stepFunctions.Pass(this, 'Otherwise', {
     result: stepFunctions.Result.fromObject({
       message: 'Otherwise Executed',
     }),
     resultPath: '$.output.otherwise',
   });

   const afterwardsPass = new stepFunctions.Pass(this, 'Afterwards', {
     result: stepFunctions.Result.fromObject({
       message: 'Afterwards Executed',
     }),
     resultPath: '$.output.afterwards',
   });
   ```

10. Update "./lib/step03_choice_part2-stack.ts" and create choice step function

    ```js
    const choice = new stepFunctions.Choice(this, 'operation successful?');
    choice.when(
      stepFunctions.Condition.booleanEquals(
        '$.Payload.operationSuccessful',
        true
      ),
      addDataSuccessInvoke
    );
    choice.when(
      stepFunctions.Condition.booleanEquals(
        '$.Payload.operationSuccessful',
        false
      ),
      addDataFailedInvoke
    );
    choice.otherwise(otherwisePass);
    choice.afterwards().next(afterwardsPass);
    ```

11. Update "./lib/step03_choice_part2-stack.ts" and create chain and state machine

    ```js
    const chain = stepFunctions.Chain.start(addDataInvoke).next(choice);
    new stepFunctions.StateMachine(this, 'choiceStateMachine', {
      definition: chain,
    });
    ```

12. Deploy the app using `cdk deploy`
13. From the console of the step function run tests.
14. Destroy the app using `cdk destroy`
