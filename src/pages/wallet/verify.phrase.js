import React, { Component } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import {
  View, StyleSheet, TouchableOpacity, Animated, Text,
} from 'react-native';
import PropTypes from 'prop-types';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { StackActions, NavigationActions } from 'react-navigation';
import Tags from '../../components/common/misc/tags';
import WordField, { wordFieldWidth } from '../../components/common/misc/wordField';
import Loc from '../../components/common/misc/loc';
import appActions from '../../redux/app/actions';
import walletActions from '../../redux/wallet/actions';
import {
  createErrorNotification, createInfoNotification, getErrorNotification, getDefaultErrorNotification,
} from '../../common/notification.controller';
import Button from '../../components/common/button/button';
import BasePageSimple from '../base/base.page.simple';
import Header from '../../components/headers/header';
import color from '../../assets/styles/color';
import fontFamily from '../../assets/styles/font.family';

const MNEMONIC_PHRASE_LENGTH = 12;
const WORD_FIELD_MARGIN = 37;
const WORD_FIELD_HEIGHT = 150;

const styles = StyleSheet.create({
  wordFieldView: {
    height: WORD_FIELD_HEIGHT,
    overflow: 'hidden',
    position: 'absolute',
    bottom: '57%',
    width: '100%',
  },
  tags: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    marginHorizontal: 20,
    alignSelf: 'center',
  },
  tip: {
    color: color.black,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.29,
    alignSelf: 'center',
  },
  confirmationView: {
    width: '100%',
    height: 200,
    backgroundColor: color.white,
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
  },
  confirmationTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 20,
  },
  confirmationButton: {
    marginTop: 20,
  },
  confirmationClearButton: {
    marginTop: 20,
  },
  confirmationClearButtonText: {
    color: color.app.theme,
    fontSize: 16,
    fontWeight: '500',
  },
  wordsView: {
    flexDirection: 'row',
  },
  wordsWrapper: {
    marginTop: 10,
    marginLeft: '50%',
  },
  wordField: {
    marginLeft: WORD_FIELD_MARGIN,
  },
  firstWordField: {
    marginLeft: -wordFieldWidth / 2,
  },
  tagsView: {
    position: 'absolute',
    bottom: '9%',
  },
  cancelIcon: {
    fontSize: 20,
    color: color.midGrey,
  },
  cancelButton: {
    position: 'relative',
    marginLeft: -200,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 21,
  },
  cancelButtonView: {
    position: 'absolute',
    width: '100%',
    height: WORD_FIELD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordIndexView: {
    alignItems: 'center',
  },
  wordIndex: {
    marginTop: 12,
    color: color.midGrey,
    fontFamily: fontFamily.AvenirMedium,
  },
});

class VerifyPhrase extends Component {
  static navigationOptions = () => ({
    header: null,
    gesturesEnabled: false,
  });

  constructor(props) {
    super(props);
    const { navigation } = this.props;
    const { phrase } = navigation.state.params;
    this.notificationReason = null;
    this.correctPhrases = phrase.split(' ');
    // Shuffle the 12-word here so user need to choose from a different order than the last time
    // We want to make sure they really write down the phrase
    const shuffleWords = _.shuffle(this.correctPhrases);
    this.state = {
      selectedWordIndexs: [],
      shuffleWords,
      isLoading: false,
      isShowConfirmation: false,
      wordsOffset: new Animated.Value(0),
      isAnimating: true,
    };

    const { multisigParams } = navigation.state.params;
    const { invitationCode } = multisigParams;
    this.invitationCode = invitationCode;

    this.renderSelectedWords = this.renderSelectedWords.bind(this);
    this.onTagsPressed = this.onTagsPressed.bind(this);
    this.reset = this.reset.bind(this);
    this.onConfirmPress = this.onConfirmPress.bind(this);
    this.onClearPress = this.onClearPress.bind(this);
    this.renderConfirmation = this.renderConfirmation.bind(this);
  }

  componentDidMount() {
    const { resetWalletsUpdated } = this.props;
    resetWalletsUpdated();
  }

  componentWillReceiveProps(nextProps) {
    const { navigation, isWalletsUpdated, sharedWalletCreationError } = nextProps;
    const { isCreatingMultisig, isJoiningMultisig } = navigation.state.params;
    const { addNotification, resetSharedWalletCreationError, sharedWalletCreationError: lastSharedWalletCreationError } = this.props;
    const { isLoading } = this.state;
    // isWalletsUpdated is true indicates wallet is added, the app will navigate to other page.
    console.log('componentWillReceiveProps, isWalletsUpdated: ', isWalletsUpdated);
    if (isWalletsUpdated && isLoading) {
      this.setState({ isLoading: false });
      if (isCreatingMultisig || isJoiningMultisig) {
        this.onMultisigWalletCreated();
        return;
      }
      navigation.navigate('VerifyPhraseSuccess');
    }

    if (!lastSharedWalletCreationError && sharedWalletCreationError) {
      this.setState({ isLoading: false });
      const notification = getErrorNotification(sharedWalletCreationError.code, 'button.retry') || getDefaultErrorNotification('button.retry');
      addNotification(notification);
      resetSharedWalletCreationError();
    }
  }

  // call resetWalletsUpdated when componentWillUnmount is safe.
  componentWillUnmount() {
    const { isWalletsUpdated, resetWalletsUpdated, resetSharedWalletCreationError } = this.props;
    if (isWalletsUpdated) {
      resetWalletsUpdated();
    }
    resetSharedWalletCreationError();
  }

  onCancelPressed = (cancelIndex) => {
    const { isShowConfirmation } = this.state;
    // Avoid user press world field when confirmation
    if (isShowConfirmation) {
      return;
    }
    this.revert(cancelIndex);
  }

  onPhraseValid() {
    const { navigation } = this.props;
    const { phrase, coins } = navigation.state.params;
    this.requestCreateWallet(phrase, coins);
  }

  onConfirmPress() {
    const { addNotification } = this.props;
    const { shuffleWords, selectedWordIndexs } = this.state;
    const selectedWords = [];
    selectedWordIndexs.forEach((selectedIndex) => {
      selectedWords.push(shuffleWords[selectedIndex]);
    });

    const isEqual = _.isEqual(selectedWords, this.correctPhrases);

    if (isEqual) {
      this.onPhraseValid();
    } else {
      this.notificationReason = 'incorrectPhrase';
      const notification = createErrorNotification(
        'modal.incorrectBackupPhrase.title',
        'modal.incorrectBackupPhrase.body',
        'button.startOver',
        () => this.reset(),
      );
      addNotification(notification);
    }
  }

  onClearPress() {
    this.reset();
  }

  onTagsPressed(index) {
    const { selectedWordIndexs } = this.state;
    selectedWordIndexs.push(index);
    this.setState({
      selectedWordIndexs,
    });

    if (selectedWordIndexs.length === MNEMONIC_PHRASE_LENGTH) {
      this.setState({ isShowConfirmation: true });
    }
    this.calculateOffsetAndMove();
  }

  onMultisigWalletCreated = () => {
    const { navigation, walletManager } = this.props;
    const wallet = walletManager.wallets[0];
    const coin = wallet.coins[0];
    navigation.navigate('Home');
    const resetAction = StackActions.reset({
      index: 1,
      actions: [
        NavigationActions.navigate({ routeName: 'Dashboard' }),
        NavigationActions.navigate({ routeName: 'MultisigAddressInvitation', params: { coin } }),
      ],
    });
    navigation.dispatch(resetAction);
  }

  calculateOffsetAndMove() {
    this.setState({ isAnimating: false });
    const { selectedWordIndexs, wordsOffset } = this.state;
    let offset = 0;
    if (selectedWordIndexs.length > 1) {
      offset = -(wordFieldWidth + WORD_FIELD_MARGIN) * (selectedWordIndexs.length - 1);
    }
    Animated.timing(
      wordsOffset,
      {
        toValue: offset,
        duration: 300,
      },
    ).start(() => {
      this.setState({ isAnimating: true });
    });
  }

  requestCreateWallet(phrase, coins) {
    const { addNotification, showPasscode, passcode } = this.props;
    if (passcode) {
      this.createWallet(phrase, coins);
    } else {
      this.notificationReason = 'createPassword';
      const notification = createInfoNotification(
        'modal.createPasscode.title',
        'modal.createPasscode.body',
        null,
        () => showPasscode('create', () => this.createWallet(phrase, coins)),
      );
      addNotification(notification);
    }
  }

  createWallet(phrase, coins) {
    // createKey cost time, it will block ui.
    // So we let run at next tick, loading ui can present first.
    const {
      navigation, walletManager, createKey, createSharedWallet, joinSharedWallet,
    } = this.props;
    const { isCreatingMultisig, isJoiningMultisig, multisigParams } = navigation.state.params;
    this.setState({ isLoading: true }, () => {
      setTimeout(() => {
        if (isCreatingMultisig) {
          const coin = coins[0];
          createSharedWallet(phrase, coin, multisigParams);
        } else if (isJoiningMultisig) {
          joinSharedWallet(phrase, multisigParams);
        } else {
          createKey(null, phrase, coins, walletManager);
        }
      }, 0);
    });
  }

  reset() {
    this.setState({ selectedWordIndexs: [], isShowConfirmation: false, wordsOffset: new Animated.Value(0) });
  }

  revert() {
    const { selectedWordIndexs } = this.state;
    selectedWordIndexs.pop();
    this.setState({
      selectedWordIndexs,
    });
    this.calculateOffsetAndMove();
  }

  renderSelectedWords() {
    const { wordsOffset } = this.state;
    const words = [];
    const { shuffleWords, selectedWordIndexs } = this.state;
    for (let i = 0; i < MNEMONIC_PHRASE_LENGTH; i += 1) {
      let text = '';
      if (i < selectedWordIndexs.length) {
        const index = selectedWordIndexs[i];
        text = shuffleWords[index];
      }
      words.push(
        <View
          style={i === 0 ? styles.firstWordField : styles.wordField}
          key={(`${i}`)}
        >
          <WordField text={text} />
          <View style={styles.wordIndexView}>
            <Text style={styles.wordIndex}>
              {`${i + 1} / ${MNEMONIC_PHRASE_LENGTH}`}
            </Text>
          </View>
        </View>,
      );
    }
    const wordsView = (
      <View style={styles.wordsWrapper}>
        <Animated.View style={[styles.wordsView, { marginLeft: wordsOffset }]}>
          {words}
        </Animated.View>
      </View>
    );
    return wordsView;
  }

  renderConfirmation() {
    const { isShowConfirmation } = this.state;
    return !isShowConfirmation ? null : (
      <View style={styles.confirmationView}>
        <Loc style={[styles.confirmationTitle]} text="page.wallet.verifyPhrase.isCorrect" />
        <Button style={[styles.confirmationButton]} text="button.confirm" onPress={this.onConfirmPress} />
        <TouchableOpacity style={styles.confirmationClearButton} onPress={this.onClearPress}><Loc style={[styles.confirmationClearButtonText]} text="button.Clear" /></TouchableOpacity>
      </View>
    );
  }

  render() {
    const { navigation } = this.props;
    const {
      shuffleWords, selectedWordIndexs, isLoading, isAnimating, isShowConfirmation,
    } = this.state;
    const isShowBackButton = isAnimating && (selectedWordIndexs.length - 1 >= 0);
    return (
      <BasePageSimple
        isSafeView
        hasBottomBtn={false}
        hasLoader
        isLoading={isLoading}
        renderAccessory={this.renderConfirmation}
        headerComponent={<Header onBackButtonPress={() => navigation.goBack()} title="page.wallet.verifyPhrase.title" />}
      >
        <View style={[styles.wordFieldView]}>
          {this.renderSelectedWords()}
          <View style={styles.cancelButtonView}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => this.onCancelPressed(selectedWordIndexs.length - 1)}
            >
              {isShowBackButton && <AntDesign style={styles.cancelIcon} name="left" />}
            </TouchableOpacity>
          </View>
        </View>
        {!isShowConfirmation && (
          <View style={[styles.tagsView]}>
            <Loc style={[styles.tip]} text="page.wallet.verifyPhrase.note" />
            <Tags
              data={shuffleWords}
              style={[styles.tags]}
              showNumber={false}
              onPress={this.onTagsPressed}
              disableIndexs={selectedWordIndexs}
            />
          </View>
        )}
      </BasePageSimple>
    );
  }
}

VerifyPhrase.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    goBack: PropTypes.func.isRequired,
    state: PropTypes.object.isRequired,
  }).isRequired,
  walletManager: PropTypes.shape({
    wallets: PropTypes.array,
  }),
  addNotification: PropTypes.func.isRequired,
  createKey: PropTypes.func.isRequired,
  resetWalletsUpdated: PropTypes.func.isRequired,
  isWalletsUpdated: PropTypes.bool.isRequired,
  showPasscode: PropTypes.func.isRequired,
  passcode: PropTypes.string,
  createSharedWallet: PropTypes.func.isRequired,
  joinSharedWallet: PropTypes.func.isRequired,
  sharedWalletCreationError: PropTypes.shape({
    code: PropTypes.number,
  }),
  resetSharedWalletCreationError: PropTypes.func.isRequired,
};

VerifyPhrase.defaultProps = {
  walletManager: undefined,
  passcode: undefined,
  sharedWalletCreationError: undefined,
};

const mapStateToProps = (state) => ({
  walletManager: state.Wallet.get('walletManager'),
  isWalletsUpdated: state.Wallet.get('isWalletsUpdated'),
  passcode: state.App.get('passcode'),
  sharedWalletCreationError: state.Wallet.get('sharedWalletCreationError'),
});

const mapDispatchToProps = (dispatch) => ({
  addNotification: (notification) => dispatch(appActions.addNotification(notification)),
  createKey: (name, phrases, coins, walletManager) => dispatch(walletActions.createKey(name, phrases, coins, walletManager)),
  resetWalletsUpdated: () => dispatch(walletActions.resetWalletsUpdated()),
  addConfirmation: (confirmation) => dispatch(appActions.addConfirmation(confirmation)),
  showPasscode: (category, callback) => dispatch(appActions.showPasscode(category, callback)),
  createSharedWallet: (phrase, coin, multisigParams) => dispatch(walletActions.createSharedWallet(phrase, coin, multisigParams)),
  joinSharedWallet: (phrase, multisigParams) => dispatch(walletActions.joinSharedWallet(phrase, multisigParams)),
  resetSharedWalletCreationError: () => dispatch(walletActions.setSharedWalletCreationError(null)),
});

export default connect(mapStateToProps, mapDispatchToProps)(VerifyPhrase);
