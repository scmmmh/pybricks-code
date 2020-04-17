import { Reducer, combineReducers } from 'redux';
import {
    HubRuntimeStatusAction,
    HubActionType,
    HubRuntimeStatusType,
} from '../actions/hub';

/**
 * Describes the state of the MicroPython runtime on the hub.
 */
export enum HubRuntimeState {
    /**
     * The hub is not connected.
     */
    Disconnected = 'hub.runtime.disconnected',
    /**
     * The runtime is idle waiting for command after soft reboot.
     */
    Idle = 'hub.runtime.idle',
    /**
     * A user program is being copied to the hub.
     */
    Loading = 'hub.runtime.loading',
    /**
     * A user program has been copied to the hub.
     */
    Loaded = 'hub.runtime.loaded',
    /**
     * A user program is running.
     */
    Running = 'hub.runtime.running',
    /**
     * The runtime encountered an error.
     */
    Error = 'hub.runtime.error',
}

const runtime: Reducer<HubRuntimeState, HubRuntimeStatusAction> = (
    state = HubRuntimeState.Disconnected,
    action,
) => {
    switch (action.type) {
        case HubActionType.RuntimeStatus:
            switch (action.newStatus) {
                case HubRuntimeStatusType.Disconnected:
                    return HubRuntimeState.Disconnected;
                case HubRuntimeStatusType.Idle:
                    return HubRuntimeState.Idle;
                case HubRuntimeStatusType.Loading:
                    return HubRuntimeState.Loading;
                case HubRuntimeStatusType.Loaded:
                    return HubRuntimeState.Loaded;
                case HubRuntimeStatusType.Running:
                    return HubRuntimeState.Running;
                case HubRuntimeStatusType.Error:
                    return HubRuntimeState.Error;
                default:
                    console.error(`bad action/state: ${action.newStatus}`);
                    return state;
            }
        default:
            return state;
    }
};

export interface HubState {
    readonly runtime: HubRuntimeState;
}

export default combineReducers({ runtime });
