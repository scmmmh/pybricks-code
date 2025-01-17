// SPDX-License-Identifier: MIT
// Copyright (c) 2021-2023 The Pybricks Authors

import { AnyAction } from 'redux';
import {
    bleDidConnectPybricks,
    bleDidDisconnectPybricks,
    bleDisconnectPybricks,
} from '../ble/actions';
import { didReceiveStatusReport } from '../ble-pybricks-service/actions';
import { Status, statusToFlag } from '../ble-pybricks-service/protocol';
import {
    didFailToFinishDownload,
    didFinishDownload,
    didProgressDownload,
    didStartDownload,
    hubDidFailToStartRepl,
    hubDidFailToStopUserProgram,
    hubDidStartRepl,
    hubDidStopUserProgram,
    hubStartRepl,
    hubStopUserProgram,
} from './actions';
import reducers, { HubRuntimeState } from './reducers';

type State = ReturnType<typeof reducers>;

test('initial state', () => {
    expect(reducers(undefined, {} as AnyAction)).toMatchInlineSnapshot(`
        {
          "downloadProgress": null,
          "hasRepl": false,
          "maxBleWriteSize": 0,
          "maxUserProgramSize": 0,
          "preferredFileFormat": null,
          "runtime": "hub.runtime.disconnected",
          "useLegacyDownload": false,
        }
    `);
});

describe('runtime', () => {
    test('', () => {
        expect(
            reducers(
                { runtime: HubRuntimeState.Disconnected } as State,
                bleDidConnectPybricks('test-id', 'Test Name'),
            ).runtime,
        ).toBe(HubRuntimeState.Unknown);
    });

    test.each(Object.values(HubRuntimeState))(
        'bleDisconnectPybricks',
        (startingState) => {
            // all states are overridden by disconnect
            expect(
                reducers({ runtime: startingState } as State, bleDisconnectPybricks())
                    .runtime,
            ).toBe(
                startingState === HubRuntimeState.Disconnected
                    ? HubRuntimeState.Disconnected
                    : HubRuntimeState.Unknown,
            );
        },
    );

    test.each(Object.values(HubRuntimeState))('didDisconnect', (startingState) => {
        // all states are overridden by disconnect
        expect(
            reducers({ runtime: startingState } as State, bleDidDisconnectPybricks())
                .runtime,
        ).toBe(HubRuntimeState.Disconnected);
    });

    test('didStartDownload', () => {
        // download ignored if disconnected
        expect(
            reducers(
                { runtime: HubRuntimeState.Disconnected } as State,
                didStartDownload(),
            ).runtime,
        ).toBe(HubRuntimeState.Disconnected);
        expect(
            reducers({ runtime: HubRuntimeState.Idle } as State, didStartDownload())
                .runtime,
        ).toBe(HubRuntimeState.Loading);
    });

    test('didProgressDownload', () => {
        // download ignored if disconnected
        expect(
            reducers(
                { runtime: HubRuntimeState.Disconnected } as State,
                didProgressDownload(0),
            ).runtime,
        ).toBe(HubRuntimeState.Disconnected);

        // this shouldn't have any effect
        expect(
            reducers(
                { runtime: HubRuntimeState.Loading } as State,
                didProgressDownload(0),
            ).runtime,
        ).toBe(HubRuntimeState.Loading);
    });

    test('didFinishDownload', () => {
        // download ignored if disconnected
        expect(
            reducers(
                { runtime: HubRuntimeState.Disconnected } as State,
                didFinishDownload(),
            ).runtime,
        ).toBe(HubRuntimeState.Disconnected);

        // normal operation
        expect(
            reducers({ runtime: HubRuntimeState.Loading } as State, didFinishDownload())
                .runtime,
        ).toBe(HubRuntimeState.Unknown);
    });

    test('didFinishDownload', () => {
        // download ignored if disconnected
        expect(
            reducers(
                { runtime: HubRuntimeState.Disconnected } as State,
                didFailToFinishDownload(),
            ).runtime,
        ).toBe(HubRuntimeState.Disconnected);

        // normal operation for error path
        expect(
            reducers(
                { runtime: HubRuntimeState.Loading } as State,
                didFailToFinishDownload(),
            ).runtime,
        ).toBe(HubRuntimeState.Idle);
    });

    test('didReceiveStatusReport', () => {
        // don't ever expect this to happen in practice since we can't receive
        // updates while disconnected
        expect(
            reducers(
                { runtime: HubRuntimeState.Disconnected } as State,
                didReceiveStatusReport(statusToFlag(Status.UserProgramRunning)),
            ).runtime,
        ).toBe(HubRuntimeState.Disconnected);

        // status update ignored while download not finished
        expect(
            reducers(
                { runtime: HubRuntimeState.Loading } as State,
                didReceiveStatusReport(statusToFlag(Status.UserProgramRunning)),
            ).runtime,
        ).toBe(HubRuntimeState.Loading);

        // normal operation - user program started
        expect(
            reducers(
                { runtime: HubRuntimeState.Unknown } as State,
                didReceiveStatusReport(statusToFlag(Status.UserProgramRunning)),
            ).runtime,
        ).toBe(HubRuntimeState.Running);

        // really short program run finished before receiving download finished
        expect(
            reducers(
                { runtime: HubRuntimeState.Unknown } as State,
                didReceiveStatusReport(0),
            ).runtime,
        ).toBe(HubRuntimeState.Idle);

        // normal operation - user program stopped
        expect(
            reducers(
                { runtime: HubRuntimeState.Running } as State,
                didReceiveStatusReport(0),
            ).runtime,
        ).toBe(HubRuntimeState.Idle);

        // ignored during start repl command
        expect(
            reducers(
                { runtime: HubRuntimeState.StartingRepl } as State,
                didReceiveStatusReport(0),
            ).runtime,
        ).toBe(HubRuntimeState.StartingRepl);

        // ignored during stop user program command
        expect(
            reducers(
                { runtime: HubRuntimeState.StoppingUserProgram } as State,
                didReceiveStatusReport(0),
            ).runtime,
        ).toBe(HubRuntimeState.StoppingUserProgram);
    });

    test('hubStartRepl', () => {
        expect(
            reducers({ runtime: HubRuntimeState.Running } as State, hubStartRepl(false))
                .runtime,
        ).toBe(HubRuntimeState.StartingRepl);
    });

    test('hubDidStartRepl', () => {
        expect(
            reducers({ runtime: HubRuntimeState.Running } as State, hubDidStartRepl())
                .runtime,
        ).toBe(HubRuntimeState.Unknown);

        // ignored if disconnected
        expect(
            reducers(
                { runtime: HubRuntimeState.Disconnected } as State,
                hubDidStartRepl(),
            ).runtime,
        ).toBe(HubRuntimeState.Disconnected);
    });

    test('hubDidFailToStartRepl', () => {
        expect(
            reducers(
                { runtime: HubRuntimeState.Running } as State,
                hubDidFailToStartRepl(),
            ).runtime,
        ).toBe(HubRuntimeState.Unknown);

        // ignored if disconnected
        expect(
            reducers(
                { runtime: HubRuntimeState.Disconnected } as State,
                hubDidFailToStartRepl(),
            ).runtime,
        ).toBe(HubRuntimeState.Disconnected);
    });

    test('hubStopUserProgram', () => {
        expect(
            reducers(
                { runtime: HubRuntimeState.Running } as State,
                hubStopUserProgram(),
            ).runtime,
        ).toBe(HubRuntimeState.StoppingUserProgram);
    });

    test('hubStopUserProgram', () => {
        expect(
            reducers(
                { runtime: HubRuntimeState.Running } as State,
                hubDidStopUserProgram(),
            ).runtime,
        ).toBe(HubRuntimeState.Unknown);

        // ignored if disconnected
        expect(
            reducers(
                { runtime: HubRuntimeState.Disconnected } as State,
                hubDidStopUserProgram(),
            ).runtime,
        ).toBe(HubRuntimeState.Disconnected);
    });

    test('hubDidFailToStopUserProgram', () => {
        expect(
            reducers(
                { runtime: HubRuntimeState.Running } as State,
                hubDidFailToStopUserProgram(),
            ).runtime,
        ).toBe(HubRuntimeState.Unknown);

        // ignored if disconnected
        expect(
            reducers(
                { runtime: HubRuntimeState.Disconnected } as State,
                hubDidFailToStopUserProgram(),
            ).runtime,
        ).toBe(HubRuntimeState.Disconnected);
    });
});
