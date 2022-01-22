# Step20-05 Map

## Steps to code

1. Create new directory using `mkdir step05_map`.
2. Navigate to newly created directory using `cd step05_map`
3. Create cdk app using `cdk init app --language typescript`
4. Use `npm run watch` to auto transpile the code
5. Install stepFunction in the app using `npm i @aws-cdk/aws-stepfunctions`. Update "./lib/step05_map-stack.ts" to create a pass step which outputs an array.

   ```js
   import * as stepFunctions from '@aws-cdk/aws-stepfunctions';
   const initialState = new stepFunctions.Pass(this, 'initialState', {
     result: stepFunctions.Result.fromArray(['entry1', 'entry2', 'entry3']),
     resultPath: '$.arrayOutput',
   });
   ```

6. Update "./lib/step05_map-stack.ts" to create a functiona which is going to be iterated

   ```js
   const mapPass = new stepFunctions.Pass(this, 'mapping');
   ```

7. Update "./lib/step05_map-stack.ts" to create a map function whihc actually iterates based on input data

   ```js
   const map = new stepFunctions.Map(this, 'MapState', {
     maxConcurrency: 1,
     itemsPath: stepFunctions.JsonPath.stringAt('$.arrayOutput'),
   });
   map.iterator(mapPass);
   ```

8. Update "./lib/step05_map-stack.ts" and create chain and state machine

   ```js
    const chain = stepFunctions.Chain.start(initialState).next(map);
    new stepFunctions.StateMachine(this, 'mapStateMachine', {
      definition: chain,
   ```

9. Deploy the app using `cdk deploy`
10. From the console of the step function run tests.
