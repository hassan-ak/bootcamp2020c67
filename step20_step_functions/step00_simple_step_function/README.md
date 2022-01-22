# Step20-00 Simple Step Function

## Steps to code

1. Create new directory using `mkdir step00_simple_step_function`.
2. Navigate to newly created directory using `cd step00_simple_step_function`
3. Create cdk app using `cdk init app --language typescript`
4. Use `npm run watch` to auto transpile the code
5. Install DDB in the app using `npm i @aws-cdk/aws-dynamodb`. Update "./lib/step00_simple_step_function-stack.ts" to create ddb table as it is going to be used in one of the lambda function

   ```js
   import * as ddb from '@aws-cdk/aws-dynamodb';
   const DynamoTable = new ddb.Table(this, 'DynamoTable', {
     partitionKey: {
       name: 'id',
       type: ddb.AttributeType.STRING,
     },
   });
   ```

6. Install Lambda function in the app using `npm i @aws-cdk/aws-lambda`. Update "./lib/step00_simple_step_function-stack.ts" to create lambda functions and grand ddb acces to the function along with set environment variables

   ```js
   import * as lambda from '@aws-cdk/aws-lambda';
   const addData = new lambda.Function(this, 'addData', {
     runtime: lambda.Runtime.NODEJS_14_X,
     code: lambda.Code.fromAsset('lambda'),
     handler: 'addData.handler',
   });
   const echoStatus = new lambda.Function(this, 'echoStatus', {
     runtime: lambda.Runtime.NODEJS_14_X,
     code: lambda.Code.fromAsset('lambda'),
     handler: 'echoStatus.handler',
   });
   DynamoTable.grantFullAccess(addData);
   addData.addEnvironment('DynamoTable', DynamoTable.tableName);
   ```

7. Create "./lambda/addData" and "./lambda/echoStatus" to define handler code for the lambda functions

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
   type event = {
     operationSuccessful: Boolean,
   };

   module.exports.handler = function (event: event) {
     console.log(event);
     if (event.operationSuccessful) {
       console.log('The data was added successfully');
     } else {
       console.log('The data was not added to the database');
     }
   };
   ```

8. Install step function task in the app using `npm i @aws-cdk/aws-stepfunctions-tasks`. Update "./lib/step00_simple_step_function-stack.ts" and create steps

   ```js
   import * as stepFunctionTasks from '@aws-cdk/aws-stepfunctions-tasks';
   const firstStep = new stepFunctionTasks.LambdaInvoke(
     this,
     'Invoke addData lambda',
     {
       lambdaFunction: addData,
     }
   );
   const secondStep = new stepFunctionTasks.LambdaInvoke(
     this,
     'Invoke echoStatus lambda',
     {
       lambdaFunction: echoStatus,
       inputPath: '$.Payload',
     }
   );
   ```

9. Install step function in the app using `npm i @aws-cdk/aws-stepfunctions`. Update "./lib/step00_simple_step_function-stack.ts" and create chain and state machine

   ```js
   import * as stepFunctions from '@aws-cdk/aws-stepfunctions';
   const chain = stepFunctions.Chain.start(firstStep).next(secondStep);
   new stepFunctions.StateMachine(this, 'simpleStateMachine', {
     definition: chain,
   });
   ```

10. Deploy the app using `cdk deploy`
11. From the console of the step function run tests.
