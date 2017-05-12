import React from 'react';
import PropTypes from 'prop-types';
import qrcode from 'qrcode';
import svgRenderQRCode from '../lib/qrcode_svg';

class QRCode extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      svgXML: '',
    }; 
  }

  componentDidMount() {
    this.setSvgXML(this.props.data, this.props.colors);
  }

  componentWillReceiveProps(nextProps) {
    this.setSvgXML(nextProps.data, nextProps.colors);
  }

  setSvgXML(data, colors) {
    const d = (data && data.length) ? data : 'cannot be empty';
    const qrdata = qrcode.create(d, { version: 5 });
    const str = svgRenderQRCode(qrdata, { colors });

    this.setState({
      svgXML: str,
    });
  }

  render() {
    const { svgXML } = this.state;

    return (
      <div dangerouslySetInnerHTML={{ __html: svgXML }}></div> 
    );
  }
}

QRCode.propTypes = {
  data: PropTypes.string.isRequired,
  colors: PropTypes.object.isRequired,
};

export default QRCode;
