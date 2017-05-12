import React from 'react';
import autoBind from 'react-autobind';

import QRCode from './components/qrcode';
import { compose, on } from './lib/utils';

const colorKeys = [
  ['topLeft', 'outer'],
  ['topLeft', 'inner'],
  ['topRight', 'outer'],
  ['topRight', 'inner'],
  ['bottomLeft', 'outer'],
  ['bottomLeft', 'inner'],
  ['mainArea', 'dark'],
  ['mainArea', 'light'],
];

const updateIn = (keys, value, obj) => {
  const updater = compose.apply(null, keys.map(key => on(key)));
  return updater(() => value)(obj);
};

const getIn = (keys, obj) => {
  return keys.reduce((prev, key) => {
    if (!prev)  return prev;
    return prev[key];
  }, obj);
};

export default class App extends React.Component {
  constructor(props) {
    super(props); 
    autoBind(this);

    this.state = {
      text: '',
      colors: {
        topLeft: {
          inner: '#000000',
          outer: '#ff0000',
        },
        topRight: {
          inner: '#000000',
          outer: '#00ff00',
        },
        bottomLeft: {
          inner: '#000000',
          outer: '#0000ff',
        },
        mainArea: {
          dark: '#000000',
          light: '#eeeeee',
        },
      }
    };
  }

  onChange(e) {
    console.log(e.target.value);
    this.setState({
      text: e.target.value,
    });
  }

  onColorChange(keys) {
    return (e) => {
      const color = e.target.value;

      this.setState({
        colors: updateIn(keys, color, this.state.colors),
      });
    };
  }

  render() {
    const { text, colors } = this.state;

    return (
      <div>
        <h1>QRCode Demo for Akinori</h1>

        <div style={{ float: 'left', marginRight: '100px' }}>
          {colorKeys.map((keys, i) => (
            <div style={{ marginBottom: '15px' }} key={i}>
              <label style={{ display: 'inline-block', width: '200px' }}>{keys.join(' - ')}</label>
              <input type="color" defaultValue={getIn(keys, colors)} onChange={this.onColorChange(keys)} />
            </div>
          ))}
        </div>

        <div style={{ float: 'left' }}>
          <div style={{ marginBottom: '20px' }}>
            <input type='text' onChange={this.onChange} placeholder="text for QR Code" style={{padding: '5px'}} />
          </div>
          <QRCode data={text} colors={colors} />
        </div>
      </div>
    );
  }
}
