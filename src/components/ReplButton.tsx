import { connect } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';
import { RootState } from '../reducers';
import { HubRuntimeState } from '../reducers/hub';
import { startRepl } from '../actions/hub';
import ActionButton, { ActionButtonProps } from './ActionButton';

type Dispatch = ThunkDispatch<{}, {}, AnyAction>;

type StateProps = Pick<ActionButtonProps, 'enabled' | 'context'>;
type DispatchProps = Pick<ActionButtonProps, 'onAction'>;
type OwnProps = Pick<ActionButtonProps, 'id'>;

const mapStateToProps = (state: RootState): StateProps => ({
    enabled:
        state.hub.runtime === HubRuntimeState.Idle ||
        state.hub.runtime === HubRuntimeState.Error,
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
    onAction: (): void => {
        dispatch(startRepl());
    },
});

const mergeProps = (
    stateProps: StateProps,
    dispatchProps: DispatchProps,
    ownProps: OwnProps,
): ActionButtonProps => ({
    tooltip: 'Start REPL in terminal',
    icon: 'repl.svg',
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
});

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(ActionButton);