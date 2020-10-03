import { ItemConfig, ManagerConfig } from '../config/config';
import { DragProxy } from '../controls/DragProxy';
import { UnexpectedNullError, UnexpectedUndefinedError } from '../errors/error';
import { Root } from '../items/Root';
import { LayoutManager } from '../LayoutManager';
import { DragListener } from '../utils/DragListener';
import { createTemplateHtmlElement } from '../utils/utils';

/**
 * Allows for any DOM item to create a component on drag
 * start tobe dragged into the Layout
 *
 * @param element
 * @param itemConfig the configuration for the contentItem that will be created
 * @param layoutManager
 *
 * @constructor
 */
export class DragSource {
    private _dragListener: DragListener | null;
    private _rootContainer: HTMLElement;
    private _dummyRootContentItem: Root | undefined;
 
    constructor(private _element: HTMLElement, private _itemConfigOrFtn: ItemConfig | (() => ItemConfig), private _layoutManager: LayoutManager) {
        this._dragListener = null;
        this._rootContainer = createTemplateHtmlElement('')

        this.createDragListener();
    }

	/**
	 * Disposes of the drag listeners so the drag source is not usable any more.
	 */
	destroy(): void {
		this.removeDragListener();
    }
    
    /**
     * Called initially and after every drag
     */
    private createDragListener() {
        this.removeDragListener();

        this._dragListener = new DragListener(this._element);
        this._dragListener.on('dragStart', (x, y) => this.onDragStart(x, y));
        this._dragListener.on('dragStop', () => this.onDragStop());
    }

    /**
     * Callback for the DragListener's dragStart event
     *
     * @param   {int} x the x position of the mouse on dragStart
     * @param   {int} y the x position of the mouse on dragStart
     */
    private onDragStart(x: number, y: number) {
        let itemConfig: ItemConfig;
        if (typeof this._itemConfigOrFtn === "function") {
            itemConfig = this._itemConfigOrFtn();
        } else {
            itemConfig = this._itemConfigOrFtn;
        }

        // const contentItem = this._layoutManager._$normalizeContentItem($.extend(true, {}, itemConfig));
        const copiedConfig = ItemConfig.createCopy(itemConfig);

        // Create a dummy ContentItem only for drag purposes
        // All ContentItems (except for root) need a parent.  When dragging, the parent is not used.
        // Instead of allowing null parents (as Javascript version did), create a temporary dummy root parent and add ContentItem to that
        // Delete Dummy root when finished dragging
        // If this does not work, need to create alternative Root class

        const rootConfig = ManagerConfig.createRootItemConfig(this._layoutManager.config);
        rootConfig.content = []; // want to create root with 0 children
        this._dummyRootContentItem = new Root(this._layoutManager, rootConfig, rootContainer);
        
        const contentItem = this._layoutManager.createContentItem(copiedConfig, this._dummyRootContentItem);
        contentItem.callDownwards('_$init');

        if (this._dragListener === null) {
            throw new UnexpectedNullError('DSODSD66746');
        } else {
            const dragProxy = new DragProxy(x, y, this._dragListener, this._layoutManager, contentItem, null);

            const transitionIndicator = this._layoutManager.transitionIndicator;
            if (transitionIndicator === null) {
                throw new UnexpectedNullError('DSODST66746');
            } else {
                transitionIndicator.transitionElements(this._element, dragProxy.element);
            }
        }
    }

    private onDragStop() {
        if (this._dummyRootContentItem === undefined) {
            throw new UnexpectedUndefinedError('DSODSDRU08116');
        } else {
            this._dummyRootContentItem._$destroy
            this._dummyRootContentItem = undefined;
        }
        this.createDragListener();
    }

    /**
	 * Called after every drag and when the drag source is being disposed of.
	 */
	private removeDragListener() {
		if (this._dragListener !== null ) {
            this._dragListener.destroy();
            this._dragListener = null;
		}
	}
}
