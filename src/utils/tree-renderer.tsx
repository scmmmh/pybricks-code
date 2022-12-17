// SPDX-License-Identifier: MIT
// Copyright (c) 2022 The Pybricks Authors

/***/
// react-complex-tree renderers for bluetprintjs integration
// based on https://github.com/lukasbach/react-complex-tree/blob/239fb0c5f49f3c24e307142fb3d7e828440c3f55/packages/blueprintjs-renderers/src/renderers.tsx
// Copyright (c) 2021 Lukas Bach

import {
    Button,
    Classes,
    Colors,
    Icon,
    IconName,
    InputGroup,
    MaybeElement,
} from '@blueprintjs/core';
import React, { createContext } from 'react';
import { TreeItem, TreeRenderProps, useTree } from 'react-complex-tree';
import { useBoolean } from 'usehooks-ts';
import { assert } from '.';

/** Combines class names into a string. */
const cx = (...classNames: Array<string | undefined | false>): string =>
    classNames.filter((cn) => !!cn).join(' ');

/** Node item data similar to blueprintsjs TreeNodeInfo */
export type TreeItemData = {
    readonly icon?: IconName | MaybeElement;
    readonly secondaryLabel?: string | MaybeElement;
};

/**
 * Tree item context that can be used to get a reference to the tree item in
 * elements passed to TreeItemData.
 */
export const TreeItemContext = createContext<TreeItem<TreeItemData>>({
    index: '<default>',
    data: {},
});

type RendererFuncs = Omit<typeof renderers, 'renderDepthOffset'>;

/**
 * The type of the `props` parameter of a react-complex-tree render function.
 * @typeParam T The name of the render function.
 */
export type RenderProps<T extends keyof RendererFuncs> = Parameters<
    RendererFuncs[T]
>[0];

const TreeContainer: React.VoidFunctionComponent<RenderProps<'renderTreeContainer'>> = (
    props,
) => {
    // work around https://github.com/lukasbach/react-complex-tree/issues/195
    const { treeLabel } = useTree();

    return (
        <div
            className={cx(Classes.TREE, Classes.FOCUS_STYLE_MANAGER_IGNORE)}
            {...props.containerProps}
            aria-label={treeLabel}
        >
            {props.children}
        </div>
    );
};

const ItemsContainer: React.VoidFunctionComponent<
    RenderProps<'renderTreeContainer'>
> = (props) => (
    <ul
        className={cx(Classes.TREE_NODE_LIST, Classes.TREE_ROOT)}
        {...props.containerProps}
        // containerProps sets role="group", which is incorrect, so this
        // has to be after
        role={undefined}
    >
        {props.children}
    </ul>
);

const Item: React.VoidFunctionComponent<RenderProps<'renderItem'>> = (props) => {
    const {
        value: isHover,
        setTrue: setIsHoverTrue,
        setFalse: setIsHoverFalse,
    } = useBoolean(false);

    return (
        <TreeItemContext.Provider value={props.item}>
            <li
                className={cx(
                    Classes.TREE_NODE,
                    // TODO: include Classes.DISABLED if disabled
                    props.context.isExpanded && Classes.TREE_NODE_EXPANDED,
                    (props.context.isSelected || props.context.isDraggingOver) &&
                        Classes.TREE_NODE_SELECTED,
                )}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseEnter={setIsHoverTrue}
                onMouseLeave={setIsHoverFalse}
                {...props.context.itemContainerWithChildrenProps}
                {...props.context.interactiveElementProps}
            >
                <div
                    className={cx(
                        Classes.TREE_NODE_CONTENT,
                        `${Classes.TREE_NODE_CONTENT}-${props.depth}`,
                    )}
                    {...props.context.itemContainerWithoutChildrenProps}
                >
                    {props.item.isFolder ? (
                        props.arrow
                    ) : (
                        <span className={Classes.TREE_NODE_CARET_NONE} />
                    )}
                    <Icon
                        className={Classes.TREE_NODE_ICON}
                        icon={props.item.data.icon}
                        aria-hidden={true}
                    />
                    {props.title}
                    {props.item.data.secondaryLabel && isHover && (
                        <span className={Classes.TREE_NODE_SECONDARY_LABEL}>
                            {props.item.data.secondaryLabel}
                        </span>
                    )}
                </div>
                {props.context.isExpanded && props.children}
            </li>
        </TreeItemContext.Provider>
    );
};

const ItemArrow: React.VoidFunctionComponent<RenderProps<'renderItemArrow'>> = (
    props,
) => (
    <Icon
        icon="chevron-right"
        className={cx(
            Classes.TREE_NODE_CARET,
            props.context.isExpanded
                ? Classes.TREE_NODE_CARET_OPEN
                : Classes.TREE_NODE_CARET_CLOSED,
        )}
        {...(props.context.arrowProps as Omit<
            React.HTMLAttributes<HTMLElement>,
            'title' | 'children'
        >)}
    />
);

const ItemTitle: React.VoidFunctionComponent<RenderProps<'renderItemTitle'>> = ({
    title,
    context,
    info,
}) => {
    if (!info.isSearching || !context.isSearchMatching || !info.search) {
        return <span className={Classes.TREE_NODE_LABEL}>{title}</span>;
    } else {
        const startIndex = title.toLowerCase().indexOf(info.search.toLowerCase());
        return (
            <React.Fragment>
                {startIndex > 0 && <span>{title.slice(0, startIndex)}</span>}
                <span className="rct-tree-item-search-highlight">
                    {title.slice(startIndex, startIndex + info.search.length)}
                </span>
                {startIndex + info.search.length < title.length && (
                    <span>
                        {title.slice(startIndex + info.search.length, title.length)}
                    </span>
                )}
            </React.Fragment>
        );
    }
};

const DragBetweenLine: React.VoidFunctionComponent<
    RenderProps<'renderDragBetweenLine'>
> = ({ draggingPosition, lineProps }) => (
    <div
        {...lineProps}
        style={{
            position: 'absolute',
            right: '0',
            top:
                draggingPosition.targetType === 'between-items' &&
                draggingPosition.linePosition === 'top'
                    ? '0px'
                    : draggingPosition.targetType === 'between-items' &&
                      draggingPosition.linePosition === 'bottom'
                    ? '-4px'
                    : '-2px',
            left: `${draggingPosition.depth * 23}px`,
            height: '4px',
            backgroundColor: Colors.BLUE3,
        }}
    />
);

const RenameInput: React.VoidFunctionComponent<RenderProps<'renderRenameInput'>> = (
    props,
) => (
    <form {...props.formProps} style={{ display: 'contents' }}>
        <span className={Classes.TREE_NODE_LABEL}>
            <input
                {...props.inputProps}
                ref={props.inputRef}
                className="rct-tree-item-renaming-input"
            />
        </span>
        <span className={Classes.TREE_NODE_SECONDARY_LABEL}>
            <Button
                icon="tick"
                {...props.submitButtonProps}
                type="submit"
                minimal={true}
                small={true}
            />
        </span>
    </form>
);

const SearchInput: React.VoidFunctionComponent<RenderProps<'renderSearchInput'>> = (
    props,
) => {
    const { ref, defaultValue, value, ...inputProps } = props.inputProps;

    assert(typeof ref !== 'string', 'cannot be a legacy ref');

    // unused - have to be excluded from inputProps for InputGroup typing compatibility
    defaultValue;
    value;

    // TODO: translate placeholder and inputProps.aria-label

    return (
        <div className={cx('rct-tree-search-input-container')}>
            <InputGroup inputRef={ref} {...inputProps} placeholder="Search..." />
        </div>
    );
};

export const renderers: Omit<
    Required<TreeRenderProps<TreeItemData>>,
    'renderDraggingItem' | 'renderDraggingItemTitle' | 'renderLiveDescriptorContainer'
> = {
    renderTreeContainer: TreeContainer,
    renderItemsContainer: ItemsContainer,
    renderItem: Item,
    renderItemArrow: ItemArrow,
    renderItemTitle: ItemTitle,
    renderDragBetweenLine: DragBetweenLine,
    renderRenameInput: RenameInput,
    renderSearchInput: SearchInput,
    renderDepthOffset: 1,
};
