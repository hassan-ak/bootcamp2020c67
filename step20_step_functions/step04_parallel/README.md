# Step20-04 Parallel

## Steps to code

1. Create new directory using `mkdir step04_parallel`.
2. Navigate to newly created directory using `cd step04_parallel`
3. Create cdk app using `cdk init app --language typescript`
4. Use `npm run watch` to auto transpile the code
5. Install stepFunction in the app using `npm i @aws-cdk/aws-stepfunctions`. Update "./lib/step04_parallel-stack.ts" to create steps from the step function as we are working with pass no need to define them separtely thet can be directly defined while defining the steps

   ```js
   import * as stepFunctions from '@aws-cdk/aws-stepfunctions';
   const parallelBranch1 = new stepFunctions.Pass(this, 'parallelBranch1', {
     result: stepFunctions.Result.fromObject({
       message: 'hello parallel branch 1',
     }),
     resultPath: '$.parallel_branch_1',
   });
   const parallelBranch2 = new stepFunctions.Pass(this, 'parallelBranch2', {
     result: stepFunctions.Result.fromObject({
       message: 'hello parallel branch 2',
     }),
     resultPath: '$.parallel_branch_2',
   });
   const parallelBranch3 = new stepFunctions.Pass(this, 'parallelBranch3', {
     result: stepFunctions.Result.fromObject({
       message: 'hello parallel branch 3',
     }),
     resultPath: '$.parallel_branch_3',
   });
   const failureBranch = new stepFunctions.Pass(this, 'failureBranch', {
     result: stepFunctions.Result.fromObject({
       message: 'hello failure branch',
     }),
     resultPath: '$.failure_branch',
   });
   ```

6. Update "./lib/step04_parallel-stack.ts" to define parellel functionality

   ```js
   const success = new stepFunctions.Succeed(this, 'successBranch');
   const parallel = new stepFunctions.Parallel(this, 'Do the work in parallel');
   parallel.branch(parallelBranch1);
   parallel.branch(parallelBranch2);
   parallel.branch(parallelBranch3);
   parallel.addRetry({ maxAttempts: 1 });
   parallel.addCatch(failureBranch);
   parallel.next(success);
   ```

7. Update "./lib/step04_parallel-stack.ts" and create chain and state machine

   ```js
   const chain = stepFunctions.Chain.start(parallel);
   new stepFunctions.StateMachine(this, 'parallelStateMachine', {
     definition: chain,
   });
   ```

8. Deploy the app using `cdk deploy`
9. From the console of the step function run tests.
