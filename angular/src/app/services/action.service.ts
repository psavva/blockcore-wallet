import { Injectable } from '@angular/core';
import { AccountFilter, Action, ActionMessage, ActionStore, MessageService } from 'src/shared';
import { CommunicationService } from './communication.service';
import { UIState } from './ui-state.service';
import { WalletManager } from './wallet-manager';

@Injectable({
  providedIn: 'root',
})
export class ActionService {
  constructor(private communication: CommunicationService, private message: MessageService, private store: ActionStore, public uiState: UIState, public walletManager: WalletManager) {}
  accountFilter: AccountFilter;
  accountId: string;
  keyId: string;
  key: string;
  // app: string;
  // content: string;
  // args: any[];

  /** Indicates if the action is a single user or if user is allowed to give authorization temporarily or permanently. */
  ephemeral = false;

  status = {
    icon: 'verified_user',
    title: 'Permission Request',
    description: '"Sign data using your private key"',
  };

  async clearAction() {
    this.store.set(undefined);
    await this.store.save();
  }

  async setAction(data: Action, broadcast: boolean) {
    debugger;
    console.log('IS THIS CALLED?!');

    if (typeof data.action !== 'string') {
      console.error('Only objects that are string are allowed as actions.');
      return;
    }

    if (data.content != null && typeof data.content !== 'string') {
      console.error('Only objects that are string are allowed as actions.');
      return;
    }

    this.store.set(data);

    await this.store.save();

    // if (broadcast) {
    //     this.broadcastState();
    // }

    // Raise this after state has been updated, so orchestrator in UI can redirect correctly.
    // this.communication.sendToAll('action-changed', this.state.action);
  }

  authorize(permission: string) {
    // Reset params so the action can be re-triggered.
    this.uiState.params = null;

    const action = this.uiState.action;
    let key = this.key;

    const network = this.walletManager.getNetwork(this.walletManager.activeAccount.networkType);

    // This is a quick workaround for adding the DID Method prefix to the key (address/pubkey) for identities.
    if (network.type === 'identity') {
      key = `${network.symbol}:${key}`;
    }

    const reply: ActionMessage = {
      prompt: true, // This indicates that message comes from the popup promt.
      target: 'provider',
      source: 'tabs',
      ext: 'blockcore',
      permission: permission,
      request: { method: action.action, params: action.params }, // Re-create the request object.
      // response: { content: action.content },
      id: this.uiState.action.id,
      type: this.uiState.action.action,
      app: this.uiState.action.app,
      walletId: this.walletManager.activeWalletId,
      accountId: this.accountId,
      keyId: this.keyId,
      key: key,
    };

    // Inform the provider script that user has signed the data.
    this.message.send(reply);
  }
}
