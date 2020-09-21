import React, { Component } from 'react';
import {
  View, StyleSheet, TextInput, Switch,
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
// import _ from 'lodash';
import appActions from '../../../redux/app/actions';
import walletActions from '../../../redux/wallet/actions';
import BasePageGereral from '../../base/base.page.general';
import Header from '../../../components/headers/header';
import Button from '../../../components/common/button/button';
import Loc from '../../../components/common/misc/loc';
import presetStyle from '../../../assets/styles/style';
import CancelablePromiseUtil from '../../../common/cancelable.promise.util';
import { BtcAddressType } from '../../../common/constants';

const styles = StyleSheet.create({
  body: {
    marginHorizontal: 25,
  },
});

class CreateMultisigAddress extends Component {
    static navigationOptions = () => ({
      header: null,
    });

    constructor(props) {
      super(props);
      this.state = {
        isLoading: false,
        canSubmit: true,
        walletName: 'Multisig Wallet',
        userName: 'cxy',
        signatures: '2',
        copayers: '2',
        isMainnet: false,
        isSegwit: false,
      };
    }

    componentWillUnmount() {
      CancelablePromiseUtil.cancel(this);
    }

    onCreateButtonPressed = async () => {
      const {
        userName, signatures, copayers, isMainnet, isSegwit,
      } = this.state;
      const type = isMainnet ? 'Mainnet' : 'Testnet';
      const signatureNumber = parseInt(signatures, 10);
      const copayerNumber = parseInt(copayers, 10);
      const { navigation } = this.props;
      const multisigParams = {
        userName, type, signatureNumber, copayerNumber,
      };
      const coins = [{ symbol: 'BTC', type, addressType: isSegwit ? BtcAddressType.segwit : BtcAddressType.legacy }];
      const navigateParams = {
        coins, shouldCreatePhrase: true, shouldVerifyPhrase: true, isCreatingMultisig: true, multisigParams,
      };
      navigation.navigate('RecoveryPhrase', navigateParams);
    }

    onWalletNameChanged = (text) => {
      this.setState({ walletName: text });
    }

    onUserNameChanged = (text) => {
      this.setState({ userName: text });
    }

    onSignaturesChanged = (text) => {
      this.setState({ signatures: text });
    }

    onCopayersChanged = (text) => {
      this.setState({ copayers: text });
    }

    onSwitchValueChanged = (value) => {
      this.setState({ isMainnet: value });
    }

    onAddressTypeChanged = (value) => {
      this.setState({ isSegwit: value });
    }

    render() {
      const {
        isLoading, canSubmit, walletName, userName, isMainnet, isSegwit, signatures, copayers,
      } = this.state;
      const { navigation } = this.props;
      const customButton = (<Button text="button.create" onPress={this.onCreateButtonPressed} disabled={!canSubmit} />);
      return (
        <BasePageGereral
          isSafeView
          hasBottomBtn
          hasLoader
          isLoading={isLoading}
          headerComponent={<Header onBackButtonPress={() => navigation.goBack()} title="page.wallet.createMultisigAddress.title" />}
          customBottomButton={customButton}
        >
          <View style={styles.body}>
            <View>
              <Loc text="page.wallet.createMultisigAddress.walletName" />
              <TextInput
                style={[presetStyle.textInput]}
                value={walletName}
                onChangeText={this.onWalletNameChanged}
                autoCapitalize="none"
                autoCorrect={false}
                blurOnSubmit={false}
              />
            </View>
            <View>
              <Loc text="page.wallet.createMultisigAddress.userName" />
              <TextInput
                style={[presetStyle.textInput]}
                value={userName}
                onChangeText={this.onUserNameChanged}
                autoCapitalize="none"
                autoCorrect={false}
                blurOnSubmit={false}
              />
            </View>
            <View>
              <Loc text="page.wallet.createMultisigAddress.signatures" />
              <TextInput
                style={[presetStyle.textInput]}
                value={signatures}
                onChangeText={this.onSignaturesChanged}
                autoCapitalize="none"
                autoCorrect={false}
                blurOnSubmit={false}
              />
            </View>
            <View>
              <Loc text="page.wallet.createMultisigAddress.copayers" />
              <TextInput
                style={[presetStyle.textInput]}
                value={copayers}
                onChangeText={this.onCopayersChanged}
                autoCapitalize="none"
                autoCorrect={false}
                blurOnSubmit={false}
              />
            </View>
            <View>
              <Loc text="page.wallet.addCustomToken.mainnet" />
              <Switch value={isMainnet} onValueChange={this.onSwitchValueChanged} />
            </View>

            <View>
              <Loc text="page.wallet.createMultisigAddress.segwit" />
              <Switch value={isSegwit} onValueChange={this.onAddressTypeChanged} />
            </View>
          </View>
        </BasePageGereral>
      );
    }
}

CreateMultisigAddress.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    goBack: PropTypes.func.isRequired,
    state: PropTypes.object.isRequired,
  }).isRequired,
  walletManager: PropTypes.shape({
    wallets: PropTypes.array,
    findToken: PropTypes.func,
  }).isRequired,
  // addMultisigBTC: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  language: state.App.get('language'),
  walletManager: state.Wallet.get('walletManager'),
});

const mapDispatchToProps = (dispatch) => ({
  addMultisigBTC: (walletManager, wallet, invitationCode, type) => dispatch(walletActions.addMultisigBTC(walletManager, wallet, invitationCode, type)),
  addConfirmation: (confirmation) => dispatch(appActions.addConfirmation(confirmation)),
  addNotification: (notification) => dispatch(appActions.addNotification(notification)),
});

export default connect(mapStateToProps, mapDispatchToProps)(CreateMultisigAddress);
