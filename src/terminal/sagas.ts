// SPDX-License-Identifier: MIT
// Copyright (c) 2020-2023 The Pybricks Authors

import { AnyAction } from 'redux';
import {
    actionChannel,
    delay,
    fork,
    getContext,
    put,
    race,
    select,
    take,
    takeEvery,
} from 'typed-redux-saga/macro';
import {
    didFailToWrite,
    didNotify,
    didWrite,
    write,
} from '../ble-nordic-uart-service/actions';
import { nordicUartSafeTxCharLength } from '../ble-nordic-uart-service/protocol';
import { checksum, hubDidStartRepl } from '../hub/actions';
import { HubRuntimeState } from '../hub/reducers';
import { RootState } from '../reducers';
import { defined } from '../utils';
import { TerminalContextValue } from './TerminalContext';
import { receiveData, sendData } from './actions';

/**
 * Partial saga context type for context used in the terminal sagas.
 */
export type TerminalSagaContext = { terminal: TerminalContextValue };

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function* receiveUartData(action: ReturnType<typeof didNotify>): Generator {
    const hubState = yield* select((s: RootState) => s.hub.runtime);

    if (hubState === HubRuntimeState.Loading && action.value.buffer.byteLength === 1) {
        const view = new DataView(action.value.buffer);
        yield* put(checksum(view.getUint8(0)));
        return;
    }

    const value = decoder.decode(action.value.buffer);
    yield* put(sendData(value));
}

function* receiveTerminalData(): Generator {
    const nextMessageId = yield* getContext<() => number>('nextMessageId');
    const channel = yield* actionChannel(receiveData);

    for (;;) {
        // wait for input from terminal
        const action = yield* take(channel);
        let value = action.value;

        // Try to collect more data so that we aren't sending just one byte at time
        while (value.length < nordicUartSafeTxCharLength) {
            const { action, timeout } = yield* race({
                action: take(channel),
                timeout: delay(20),
            });
            if (timeout) {
                break;
            }
            defined(action);
            value += action.value;
        }

        const isUserProgramRunning = yield* select(
            (s: RootState) => s.hub.runtime === HubRuntimeState.Running,
        );

        // REVISIT: this test is a bit dangerous since it is not actually
        // testing that handleWriteUart in ble/sagas is running. In theory
        // it should be fine as long a the logic for the state doesn't change.
        if (!isUserProgramRunning) {
            // if no user program is running, input goes to /dev/null
            // print the BEL character (^G) to notify the user that the input was ignored
            yield* put(sendData('\x07'));
            continue;
        }

        // stdin gets piped to BLE connection
        const data = encoder.encode(value);

        for (let i = 0; i < data.length; i += nordicUartSafeTxCharLength) {
            const { id } = yield* put(
                write(nextMessageId(), data.slice(i, i + nordicUartSafeTxCharLength)),
            );

            yield* take(
                (a: AnyAction) =>
                    (didWrite.matches(a) || didFailToWrite.matches(a)) && a.id === id,
            );

            // wait for echo so tht we don't overrun the hub with messages
            yield* race([take(didNotify), delay(100)]);
        }
    }
}

function* sendTerminalData(action: ReturnType<typeof sendData>): Generator {
    const { dataSource } = yield* getContext<TerminalContextValue>('terminal');
    // This is used to provide a data source for the Terminal component
    dataSource.next(action.value);
}

function handleHubDidStartRepl(): void {
    dispatchEvent(new CustomEvent('pb-terminal-focus'));
}

export default function* (): Generator {
    yield* takeEvery(didNotify, receiveUartData);
    yield* fork(receiveTerminalData);
    yield* takeEvery(sendData, sendTerminalData);
    yield* takeEvery(hubDidStartRepl, handleHubDidStartRepl);
}
