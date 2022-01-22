# Step20 - Step Functions

## Class Notes

- Step functions are used for orchestration. Smooth flow of the work.
- It allows to create workflows in sequence (steps). Workflow built with step functions are said to be state machines. State transition is movement from one state to another.
- State Types
  - Task
  - Choice
  - Wait
  - Parallel
  - Map
  - Succeed
  - Fail
  - Pass

## Reading Material

- [What is AWS Step Functions?](https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html)
- [AWS Step Functions Construct Library](https://docs.aws.amazon.com/cdk/api/v1/docs/aws-stepfunctions-readme.html)

## Sections

- [Simple Step Function](./step00_simple_step_function)
- [Pass Wait](./step01_pass_wait)
- [Choice Part1](./step02_choice_part1)
- [Choice Part2](./step03_choice_part2)
- [Parallel](./step04_parallel)
- [Map](./step05_map)
- [Invoke step function with event](./step06_invoke_step_function_with_event)
