import {OverlayRef, GlobalPositionStrategy} from '../core';
import {DialogPosition} from './dialog-config';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {MdDialogContainer, MdDialogContainerAnimationState} from './dialog-container';


// TODO(jelbourn): resizing
// TODO(jelbourn): afterOpen and beforeClose


/**
 * Reference to a dialog opened via the MdDialog service.
 */
export class MdDialogRef<T> {
  /** The instance of component opened into the dialog. */
  componentInstance: T;

  /** Subject for notifying the user that the dialog has finished closing. */
  private _afterClosed: Subject<any> = new Subject();

  /** Result to be passed to afterClosed. */
  private _result: any;

  constructor(private _overlayRef: OverlayRef, public _containerInstance: MdDialogContainer) {
    _containerInstance._onAnimationStateChange.subscribe(
      (state: MdDialogContainerAnimationState) => {
        if (state === 'exit-start') {
          // Transition the backdrop in parallel with the dialog.
          this._overlayRef.detachBackdrop();
        } else if (state === 'exit') {
          this._overlayRef.dispose();
          this._afterClosed.next(this._result);
          this._afterClosed.complete();
          this.componentInstance = null;
        }
      });
  }

  /**
   * Close the dialog.
   * @param dialogResult Optional result to return to the dialog opener.
   */
  close(dialogResult?: any): void {
    this._result = dialogResult;
    this._containerInstance._exit();
  }

  /**
   * Gets an observable that is notified when the dialog is finished closing.
   */
  afterClosed(): Observable<any> {
    return this._afterClosed.asObservable();
  }

  /**
   * Updates the dialog's position.
   * @param position New dialog position.
   */
  updatePosition(position?: DialogPosition): this {
    let strategy = this._getPositionStrategy();

    if (position && (position.left || position.right)) {
      position.left ? strategy.left(position.left) : strategy.right(position.right);
    } else {
      strategy.centerHorizontally();
    }

    if (position && (position.top || position.bottom)) {
      position.top ? strategy.top(position.top) : strategy.bottom(position.bottom);
    } else {
      strategy.centerVertically();
    }

    this._overlayRef.updatePosition();

    return this;
  }

  /**
   * Updates the dialog's width and height.
   * @param width New width of the dialog.
   * @param height New height of the dialog.
   */
  updateSize(width = 'auto', height = 'auto'): this {
    this._getPositionStrategy().width(width).height(height);
    this._overlayRef.updatePosition();
    return this;
  }

  /** Fetches the position strategy object from the overlay ref. */
  private _getPositionStrategy(): GlobalPositionStrategy {
    return this._overlayRef.getState().positionStrategy as GlobalPositionStrategy;
  }
}
