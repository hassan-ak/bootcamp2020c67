# Step20-01 Pass Wait

## Steps to code

1. Create new directory using `mkdir step01_pass_wait`.
2. Navigate to newly created directory using `cd step01_pass_wait`
3. Create cdk app using `cdk init app --language typescript`
4. Use `npm run watch` to auto transpile the code
5. Install stepFunction in the app using `npm i @aws-cdk/aws-stepfunctions`. Update "./lib/step01_pass_wait-stack.ts" to create steps fro the step function as we are working with pass and wait no need to define them separtely thet can be directly defined while defining the steps

   ```js
   import * as stepFunctions from '@aws-cdk/aws-stepfunctions';
   const pass = new stepFunctions.Pass(this, 'Pass', {
     result: stepFunctions.Result.fromObject({ triggerTime: 2 }),
     resultPath: '$.subObject',
   });
   const wait = new stepFunctions.Wait(this, 'Wait For Trigger Time', {
     time: stepFunctions.WaitTime.secondsPath('$.subObject.triggerTime'),
   });
   ```

6. Update "./lib/step01_pass_wait-stack.ts" and create chain and state machine

   ```js
   const chain = stepFunctions.Chain.start(pass).next(wait);
   new stepFunctions.StateMachine(this, 'state_machine_pass_wait', {
     definition: chain,
   });
   ```

7. Deploy the app using `cdk deploy`
8. From the console of the step function run tests.
9. Destroy the app using `cdk destroy`
