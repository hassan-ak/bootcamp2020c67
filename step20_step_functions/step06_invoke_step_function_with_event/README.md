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
