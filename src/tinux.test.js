import tinux from "./tinux";

test("Should dispatch action properly", () => {
  const Increase = state => state + 1;
  const store = tinux(0);
  store.dispatch(Increase);
  expect(store.select()).toBe(1);
});

test("Should skip state update if action result is undefined", () => {
  const Increase = state => {};
  const store = tinux(0);
  store.dispatch(Increase);
  expect(store.select()).toBe(0);
});

test("Should skip state update if action result is promise", () => {
  const Increase = async state => {};
  const store = tinux(0);
  store.dispatch(Increase);
  expect(store.select()).toBe(0);
});

test("Should handle future action properly", async () => {
  const Increase = async state => {};
  const fn = jest.fn();
  const Startup = async (_, { until }) => {
    await until(Increase);
    fn();
  };
  const store = tinux(0);
  store.dispatch(Startup);
  store.dispatch(Increase);
  await delay(1);
  expect(fn.mock.calls.length).toBe(1);
});

function delay(interval, value) {
  return new Promise(resolve => setTimeout(resolve, interval, value));
}
