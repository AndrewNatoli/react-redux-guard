import * as React from 'react';
import { connect } from 'react-redux';

export type AnyObjectType = { [index: string]: any };
export type GuardActionType = (dispatch: any) => Promise<any>;
export type GuardCheckType = (props: AnyObjectType, forceFailure?: boolean) => JSX.Element | undefined | null;
export type LoaderType = React.ReactNode | any | null;

export type GuardedComponentState = {
  initialized: boolean;
  failed: boolean;
};

/**
 * @param WrappedComponent Component to guard
 * @param guardAction Must return a promise. If the promise resolves, the guardCheck will run. If the promise
 * rejects we will pass forceFailure into the guardCheck so you can choose to have the guardCheck fail.
 * @param guard Gets passed state so you can check what you need to determine if the guard will allow or
 * disallow presentation of the WrappedComponent.
 */
const withGuard = (LoaderComponent: LoaderType = null) => <MSTP extends {}>(
  mapStateToProps: (state: AnyObjectType) => MSTP,
  guardAction: GuardActionType,
  guardCheck: GuardCheckType
) => (WrappedComponent: any) => {
  class GuardedComponent extends React.Component<any, GuardedComponentState> {
    constructor(props: any) {
      super(props);
      this.state = {
        initialized: false,
        failed: false
      };
    }

    async componentDidMount() {
      const { dispatch } = this.props;
      const newState = { ...this.state };
      try {
        await guardAction(dispatch);
      } catch {
        newState.failed = true;
      } finally {
        newState.initialized = true;
        this.setState(newState);
      }
    }

    render() {
      const { initialized, failed } = this.state;
      if (initialized === true) {
        const FailComponent = guardCheck(this.props, failed);
        if (FailComponent !== undefined) {
          return FailComponent;
        } else {
          return <WrappedComponent {...this.props} />;
        }
      }
      return LoaderComponent;
    }
  }

  return connect<MSTP, {}, any>(mapStateToProps)(GuardedComponent);
};

export default withGuard;
