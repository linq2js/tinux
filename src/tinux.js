import { useRef, useEffect, useState } from "react";

const refHook = useRef;
export const Any = () => {};
class RevertError extends Error {}

export default function createStore(initialState) {
  const subscriptions = new Set();
  const api = {
    subscribe,
    dispatch,
    select
  };
  let currentState = initialState;

  function subscribe(subscription) {
    if (arguments.length > 1) {
      const action = arguments[0];
      const handler = arguments[1];
      subscription = (state, params) =>
        params.action === action && handler(state, params);
    }
    subscriptions.add(subscription);
    return () => {
      subscriptions.delete(subscription);
    };
  }

  function revert() {
    throw new RevertError();
  }

  function select(selectors) {
    if (isHookEnabled()) {
      return ApplyHook(selectors, { select: selectState, dispatch, subscribe });
    }

    return selectState(selectors);
  }

  function selectState(selectors) {
    if (Array.isArray(selectors)) {
      return selectors[0](currentState, ...selectors.slice(1));
    }

    if (typeof selectors === "function") {
      return selectors(currentState);
    }

    if (isPlainObject(selectors)) {
      const entries = Object.entries(selectors);
      const result = {};
      for (const [key, selector] of entries) {
        result[key] = select(selector);
      }

      return result;
    }

    return currentState;
  }

  function until(futureAction) {
    return new Promise(resolve => {
      const unsubscribe = subscribe((state, { action, payload }) => {
        if (futureAction === Any || futureAction === action) {
          unsubscribe();
          resolve({ action, payload });
        }
      });
    });
  }

  function dispatch(action, payload) {
    const params = {
      action,
      payload,
      select,
      dispatch,
      until,
      subscribe,
      revert
    };
    const nextState = action(currentState, params);
    let prevState = currentState;
    if (
      typeof nextState !== "undefined" &&
      // not async action
      typeof nextState.then !== "function" &&
      nextState !== currentState
    ) {
      currentState = nextState;
    }
    try {
      for (const subscription of subscriptions) {
        subscription(currentState, params);
      }
    } catch (e) {
      if (e instanceof RevertError) {
        currentState = prevState;
      }
    }
    return nextState;
  }

  return api;
}

function isHookEnabled() {
  try {
    refHook();
    return true;
  } catch {
    return false;
  }
}

function ApplyHook(selectors, { select, subscribe }) {
  const dataRef = useRef({});
  const [, forceRerender] = useState();
  const data = dataRef.current;

  data.props = select(selectors);
  data.select = select;
  data.selectors = selectors;

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      if (data.isUnmount) return;
      const nextProps = data.select(data.selectors);
      const hasChange =
        (isPlainObject(nextProps) &&
          isPlainObject(data.props) &&
          Object.keys(nextProps)
            .concat(data.props)
            .some(key => data.props[key] !== nextProps[key])) ||
        data.props !== nextProps;
      if (hasChange) forceRerender({});
    });

    return function() {
      data.isUnmount = true;
      unsubscribe();
    };
  }, [data, forceRerender, subscribe]);

  return data.props;
}

function isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === "[object Object]";
}
