// SPDX-License-Identifier: MIT
// Copyright (c) 2020 The Pybricks Authors

import { Classes } from '@blueprintjs/core';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SplitterLayout from 'react-splitter-layout';
import { toggleBoolean } from '../actions/settings';
import { RootState } from '../reducers';
import { SettingId } from '../settings/user';
import { isMacOS } from '../utils/os';
import Editor from './Editor';
import SettingsDrawer from './SettingsDrawer';
import StatusBar from './StatusBar';
import Terminal from './Terminal';
import Toolbar from './Toolbar';

import 'react-splitter-layout/lib/index.css';
import './app.scss';

function App(): JSX.Element {
    const showDocs = useSelector((s: RootState): boolean => s.settings.showDocs);
    const [dragging, setDragging] = useState(false);
    const dispatch = useDispatch();

    return (
        <div className="app">
            <Toolbar />
            <SplitterLayout
                customClassName={`h-body ${showDocs ? 'pb-show-docs' : 'pb-hide-docs'}`}
                onDragStart={(): void => setDragging(true)}
                onDragEnd={(): void => setDragging(false)}
                percentage={true}
                secondaryInitialSize={Number(
                    localStorage.getItem('app-docs-split') || 30,
                )}
                onSecondaryPaneSizeChange={(value): void =>
                    localStorage.setItem('app-docs-split', String(value))
                }
            >
                <SplitterLayout
                    vertical={true}
                    percentage={true}
                    secondaryInitialSize={Number(
                        localStorage.getItem('app-terminal-split') || 30,
                    )}
                    onSecondaryPaneSizeChange={(value): void =>
                        localStorage.setItem('app-terminal-split', String(value))
                    }
                >
                    <Editor />
                    <div className="terminal-padding h-100">
                        <Terminal />
                    </div>
                </SplitterLayout>
                <div className="h-100 w-100">
                    {dragging && <div className="h-100 w-100 p-absolute" />}
                    <iframe
                        // REVISIT: some of this could be moved to the docs repo
                        // so that it runs earlier to prevent flashing in the UI.
                        // The load event doesn't run until after the page is fully
                        // loaded and there doesn't seem to be a reasonable way to
                        // hook into the iframe to know when it has a new document.
                        onLoad={(e) => {
                            // HACK: this mess restores the scroll position when
                            // the documentation iframe visibility is toggled.
                            // The iframe will be automatically scrolled to 0 when
                            // CSS `display: none` is set.

                            const target = e.target as HTMLIFrameElement;
                            const contentWindow = target.contentWindow;
                            if (!contentWindow) {
                                console.error('could not get iframe content window');
                                return;
                            }

                            // the last "good" scrollY value of the iframe
                            let iframeScroll = 0;

                            // This bit monitors the visibility.
                            // https://stackoverflow.com/a/44670818/1976323
                            const observer = new IntersectionObserver(
                                (entries) => {
                                    entries.forEach((entry) => {
                                        // Restore the scroll position when the
                                        // iframe is shown. Toggling the visibility
                                        // prevents flashing the contents from the
                                        // top of the page before the scroll is
                                        // done.
                                        if (entry.intersectionRatio > 0) {
                                            contentWindow.scrollTo(0, iframeScroll);
                                            contentWindow.document.documentElement.style.visibility =
                                                'visible';
                                        } else {
                                            contentWindow.document.documentElement.style.visibility =
                                                'hidden';
                                        }
                                    });
                                },
                                {
                                    root: target.parentElement,
                                },
                            );

                            observer.observe(target);

                            // Have to remove he observer, otherwise we end up
                            // with conflicting values when a new page is loaded
                            // in the iframe.
                            contentWindow.addEventListener('unload', () => {
                                observer.unobserve(target);
                            });

                            // And this keeps track of the scroll position.
                            contentWindow.addEventListener('scroll', () => {
                                if (contentWindow.scrollY !== 0) {
                                    // Record the current scroll position.
                                    // If it is 0, it could be that the iframe
                                    // has been hidden or the user scrolled
                                    // there. So we have to ignore 0. But we
                                    // don't want to be one pixel off if the
                                    // user really did scroll there, so we
                                    // assume that if the last scroll is 1, then
                                    // the user probably went all the way to 0.
                                    if (contentWindow.scrollY === 1) {
                                        iframeScroll = 0;
                                    } else {
                                        iframeScroll = contentWindow.scrollY;
                                    }
                                }
                            });

                            // Override browser default key bindings in iframe.
                            contentWindow.document.addEventListener('keydown', (e) => {
                                // use Ctrl-D/Cmd-D to toggle docs
                                if (
                                    (isMacOS()
                                        ? e.metaKey && !e.ctrlKey
                                        : e.ctrlKey && !e.metaKey) &&
                                    !e.altKey &&
                                    e.key == 'd'
                                ) {
                                    e.preventDefault();
                                    dispatch(toggleBoolean(SettingId.ShowDocs));
                                }
                            });

                            const style = document.createElement('style');

                            // TODO: how to get these programmatically from values set in variables.scss?
                            const iconColor = '#5c7080';
                            const iconColorHover = '#182026';
                            const appBackgroundColor = '#e8e8e8';
                            const darkIconColor = '#a7b6c2';
                            const darkIconColorHover = '#f5f8fa';
                            const darkAppBackgroundColor = '#293742';

                            // This is scrollbar style coped from index.scss.
                            style.innerText = `
::-webkit-scrollbar {
    width: 16px;
}

.${Classes.DARK} ::-webkit-scrollbar-track {
    background: ${darkAppBackgroundColor};
}

::-webkit-scrollbar-track {
    background: ${appBackgroundColor};
}

.${Classes.DARK} ::-webkit-scrollbar-thumb {
    border-color: ${darkAppBackgroundColor};
    background: ${darkIconColor};
}

::-webkit-scrollbar-thumb {
    border-width: 3px;
    border-style: solid;
    border-radius: 8px;
    border-color: ${appBackgroundColor};
    background: ${iconColor};
}

.${Classes.DARK} ::-webkit-scrollbar-thumb:hover {
    background: ${darkIconColorHover};
}

::-webkit-scrollbar-thumb:hover {
    background: ${iconColorHover};
}
`;
                            contentWindow.document.head.appendChild(style);

                            if (document.body.classList.contains(Classes.DARK)) {
                                contentWindow.document.documentElement.classList.add(
                                    Classes.DARK,
                                );
                            }
                        }}
                        src="static/docs/index.html"
                        allowFullScreen={true}
                        title="docs"
                        width="100%"
                        height="100%"
                        frameBorder="none"
                    />
                </div>
            </SplitterLayout>
            <StatusBar />
            <SettingsDrawer />
        </div>
    );
}

export default App;
