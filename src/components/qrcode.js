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
    this.setSvgXML(this.props.data, this.props.colors, this.props.logo);
  }

  componentWillReceiveProps(nextProps) {
    this.setSvgXML(nextProps.data, nextProps.colors, nextProps.logo);
  }

  setSvgXML(data, colors, logo) {
    const d = (data && data.length) ? data : 'cannot be empty';
    const qrdata = qrcode.create(d, { version: 5 });
    const str = svgRenderQRCode(qrdata, { colors, logo });

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
  logo: PropTypes.string,
  colors: PropTypes.object.isRequired,
};

export default QRCode;
