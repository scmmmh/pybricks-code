// SPDX-License-Identifier: MIT
// Copyright (c) 2022 The Pybricks Authors

import { AnchorButton, Button, Intent } from '@blueprintjs/core';
import React from 'react';
import {
    pybricksUsbDfuTroubleshootingUrl,
    pybricksUsbLinuxUdevRulesUrl,
} from '../../app/constants';
import ExternalLinkIcon from '../../components/ExternalLinkIcon';
import type { CreateToast } from '../../toasterTypes';
import { isLinux, isWindows } from '../../utils/os';
import { useI18n } from './i18n';

type NoDfuHubProps = {
    onInstallWindowsDriver: () => void;
};

const NoDfuHub: React.VoidFunctionComponent<NoDfuHubProps> = ({
    onInstallWindowsDriver,
}) => {
    const i18n = useI18n();

    return (
        <>
            <p>{i18n.translate('noDfuHub.message')}</p>

            {isWindows() && <p>{i18n.translate('noDfuHub.suggestion1.windows')}</p>}
            {isLinux() && <p>{i18n.translate('noDfuHub.suggestion1.linux')}</p>}
            <div className="pb-ble-alerts-buttons">
                {isWindows() && (
                    <Button icon="download" onClick={onInstallWindowsDriver}>
                        {i18n.translate('noDfuHub.installUsbDriverButton')}
                    </Button>
                )}
                {isLinux() && (
                    <AnchorButton
                        icon="help"
                        href={pybricksUsbLinuxUdevRulesUrl}
                        target="_blank"
                        rel="noopener"
                    >
                        {i18n.translate('noDfuHub.configureUdevRulesButton')}
                        <ExternalLinkIcon />
                    </AnchorButton>
                )}
                <AnchorButton
                    icon="help"
                    href={pybricksUsbDfuTroubleshootingUrl}
                    target="_blank"
                    rel="noopener"
                >
                    {i18n.translate('noDfuHub.troubleshootButton')}
                    <ExternalLinkIcon />
                </AnchorButton>
            </div>
        </>
    );
};

export const noDfuHub: CreateToast<never, 'dismiss' | 'installWindowsDriver'> = (
    onAction,
) => ({
    message: (
        <NoDfuHub onInstallWindowsDriver={() => onAction('installWindowsDriver')} />
    ),
    icon: 'info-sign',
    intent: Intent.PRIMARY,
    onDismiss: () => onAction('dismiss'),
});
