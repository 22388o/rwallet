import React from 'react';
import {
  StyleSheet, TouchableOpacity, View,
} from 'react-native';
import PropTypes from 'prop-types';
import color from '../../../assets/styles/color.ts';
import Loc from '../misc/loc';

const styles = StyleSheet.create({
  button: {
    width: 260,
    alignItems: 'center',
    backgroundColor: color.component.button.backgroundColor,
    borderRadius: 27,
  },
  buttonText: {
    textAlign: 'center',
    padding: 20,
    color: color.component.button.color,
    fontSize: 16,
    fontFamily: 'Avenir Black',
    fontWeight: '900',
  },
});

export default function Button({ text, onPress }) {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.button}>
        <Loc style={[styles.buttonText]} text={text} />
      </View>
    </TouchableOpacity>
  );
}

Button.propTypes = {
  text: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
};