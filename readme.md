# moduz

150 lines state management for React

## Sample Counter App

```jsx harmony
import React from "react";
import tinux from "tinux";
import "./styles.css";

const delay = interval => new Promise(resolve => setTimeout(resolve, interval));
// create store with initial state
const store = tinux({
  count: 0,
  logs: []
});
// define actions
const Increase = state => ({ ...state, count: state.count + 1 });
const Decrease = state => ({ ...state, count: state.count - 1 });
const Noop = () => {};
const AppendLog = (state, { payload }) => ({
  ...state,
  logs: state.logs.concat(payload)
});
const IncreaseAsync = async (_, { dispatch }) => {
  await delay(1000);
  dispatch(Increase);
};
// define flows.
const LogFlow = (state, { dispatch }) => {
  dispatch(AppendLog, `Counter changed: ${CountSelector(state)}`);
};
const StartupFlow = async (_, { until, dispatch, subscribe }) => {
  // log action dispatching
  subscribe(Increase, LogFlow);
  subscribe(Decrease, LogFlow);

  // continuous future action handling
  while (true) {
    const { payload } = await until(Noop);
    dispatch(AppendLog, `Noop dispatched: ${payload}`);
  }
};
const CountValidation = (state, { revert }) => {
  if (CountSelector(state) < 0) {
    revert();
  }
};
// define selectors
const CountSelector = state => state.count;
const LogsSelector = state => state.logs;

store.subscribe(CountValidation);
store.dispatch(StartupFlow);

export default function App() {
  // no hook needed
  const { count, logs } = store.select({
    count: CountSelector,
    logs: LogsSelector
  });
  const handleNoop = () => store.dispatch(Noop, Date.now());
  const handleIncrease = () => store.dispatch(Increase);
  const handleDecrease = () => store.dispatch(Decrease);
  const handleIncreaseAsync = () => store.dispatch(IncreaseAsync);
  return (
    <div className="App">
      <h1>{count}</h1>
      <button onClick={handleIncrease}>Increase</button>
      <button onClick={handleIncreaseAsync}>Increase (Async)</button>
      <button onClick={handleDecrease}>Decrease</button>
      <button onClick={handleNoop}>Noop</button>
      <xmp>{logs.join("\n")}</xmp>
    </div>
  );
}
```

## Need more powerful state management lib ? [Please refer moduz](https://www.npmjs.com/package/moduz)
