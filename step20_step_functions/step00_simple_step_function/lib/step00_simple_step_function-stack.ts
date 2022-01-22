import * as cdk from '@aws-cdk/core';
import * as ddb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as stepFunctionTasks from '@aws-cdk/aws-stepfunctions-tasks';
import * as stepFunctions from '@aws-cdk/aws-stepfunctions';

export class Step00SimpleStepFunctionStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DDB table as it is going to be used in lambda function
    const DynamoTable = new ddb.Table(this, 'DynamoTable', {
      partitionKey: {
        name: 'id',
        type: ddb.AttributeType.STRING,
      },
    });

    // Lambda functions
    // this function adds data to the dynamoDB table
    const addData = new lambda.Function(this, 'addData', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'addData.handler',
    });
    // this function logs the status of the operation
    const echoStatus = new lambda.Function(this, 'echoStatus', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'echoStatus.handler',
    });
    // giving access to the lambda function to do operations on the dynamodb table
    DynamoTable.grantFullAccess(addData);
    addData.addEnvironment('DynamoTable', DynamoTable.tableName);

    // creating steps for the step function
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

    // creating chain to define the sequence of execution
    const chain = stepFunctions.Chain.start(firstStep).next(secondStep);

    // create a state machine
    new stepFunctions.StateMachine(this, 'simpleStateMachine', {
      definition: chain,
    });
  }
}
