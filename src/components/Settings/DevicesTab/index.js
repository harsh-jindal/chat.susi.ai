import React from 'react';
import styled from 'styled-components';
import { GoogleApiWrapper } from 'google-maps-react';
import SettingsTabWrapper from '../SettingsTabWrapper';
import DevicesTable from './DevicesTable';
import MapContainer from './MapContainer';
import PropTypes from 'prop-types';
import uiActions from '../../../redux/actions/ui';
import { addUserDevice, removeUserDevice } from '../../../apis/index';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import CircularLoader from '../../shared/CircularLoader';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Button from '@material-ui/core/Button';

const EmptyDevicesText = styled.div`
  font-size: 24px;
  font-weight: 100;
  margin: 20px auto;
  max-width: 880px;
  text-align: center;
  font-family: 'Roboto', sans-serif;
`;

const CustomButton = styled(Button)`
  margin-left: 35px;
  margin-bottom: 10px;
`;

class DevicesTab extends React.Component {
  static propTypes = {
    google: PropTypes.object,
    actions: PropTypes.object,
    mapKey: PropTypes.string,
    accessToken: PropTypes.string,
    devices: PropTypes.object,
    userName: PropTypes.string,
    email: PropTypes.string,
  };

  state = {
    devicesData: [],
    invalidLocationDevices: 0,
    editIdx: null,
    synchronizePublicSkills: true,
    synchronizePrivateSkills: false,
  };

  componentDidMount() {
    this.initialiseDevices();
  }

  handleRemoveDevice = rowIndex => {
    const data = this.state.devicesData;

    removeUserDevice({ macId: data[rowIndex].macId })
      .then(payload => {
        this.setState({
          devicesData: data.filter((row, index) => index !== rowIndex),
        });
        this.props.actions.closeModal();
      })
      .catch(error => {
        console.log(error);
      });
  };

  startEditing = rowIndex => {
    this.setState({ editIdx: rowIndex });
  };

  handleChange = (e, fieldName, rowIndex) => {
    const value = e.target.value;
    let data = this.state.devicesData;
    this.setState({
      devicesData: data.map((row, index) =>
        index === rowIndex ? { ...row, [fieldName]: value } : row,
      ),
    });
  };

  handleRemoveConfirmation = rowIndex => {
    this.props.actions.openModal({
      modalType: 'deleteDevice',
      removeDeviceIndex: rowIndex,
      removeDeviceName: this.state.devicesData[rowIndex].deviceName,
      onDeviceRemove: this.handleRemoveDevice,
      onCancel: this.props.actions.closeModal,
    });
  };

  handleDeviceSave = rowIndex => {
    this.setState({
      editIdx: -1,
    });
    const deviceData = this.state.devicesData[rowIndex];

    addUserDevice({ ...deviceData })
      .then(payload => {})
      .catch(error => {
        console.log(error);
      });
  };

  initialiseDevices = () => {
    const { devices } = this.props;

    if (devices) {
      let devicesData = [];
      let deviceIds = Object.keys(devices);
      let invalidLocationDevices = 0;

      deviceIds.forEach(eachDevice => {
        const {
          name,
          room,
          geolocation: { latitude, longitude },
        } = devices[eachDevice];

        let deviceObj = {
          macId: eachDevice,
          deviceName: name,
          room,
          latitude,
          longitude,
          location: `${latitude}, ${longitude}`,
        };

        if (
          deviceObj.latitude === 'Latitude not available.' ||
          deviceObj.longitude === 'Longitude not available.'
        ) {
          deviceObj.location = 'Not found';
          invalidLocationDevices++;
        } else {
          deviceObj.latitude = parseFloat(latitude);
          deviceObj.longitude = parseFloat(longitude);
        }
        devicesData.push(deviceObj);
      });

      this.setState({
        devicesData,
        invalidLocationDevices,
      });
    }
  };

  handleCheck = event => {
    this.setState({
      [event.target.name]: event.target.checked,
    });
  };

  render() {
    const {
      devicesData,
      invalidLocationDevices,
      editIdx,
      synchronizePublicSkills,
      synchronizePrivateSkills,
    } = this.state;
    const { google, mapKey, devices, email, userName } = this.props;
    return (
      <React.Fragment>
        <SettingsTabWrapper heading="Devices">
          {devicesData.length ? (
            <div>
              <DevicesTable
                handleRemoveConfirmation={this.handleRemoveConfirmation}
                startEditing={this.startEditing}
                editIdx={editIdx}
                onDeviceSave={this.handleDeviceSave}
                handleChange={this.handleChange}
                tableData={devicesData}
              />
              <div>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="synchronizePublicSkills"
                      checked={synchronizePublicSkills}
                      onChange={this.handleCheck}
                      color="primary"
                    />
                  }
                  label="(Coming Soon) Synchronize local skills with SUSI.AI skills database regularly"
                />
                <div>
                  <CustomButton
                    variant="contained"
                    color="primary"
                    size="small"
                  >
                    Synchronize Now
                  </CustomButton>
                </div>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="synchronizePrivateSkills"
                      checked={synchronizePrivateSkills}
                      onChange={this.handleCheck}
                      color="primary"
                    />
                  }
                  label="(Coming Soon) Synchronize (upload) private skills I create locally with my online account when online"
                />
                <div>
                  <CustomButton
                    variant="contained"
                    color="primary"
                    size="small"
                  >
                    Upload Now
                  </CustomButton>
                </div>
              </div>
              <div>
                {!devices ? (
                  <Button variant="contained" color="primary" size="small">
                    Link SUSI.AI account with device
                  </Button>
                ) : (
                  <div>
                    <b>
                      Device linked to SUSI.AI account{' '}
                      {userName !== '' ? userName : email}
                    </b>{' '}
                    <Button variant="contained" color="primary" size="small">
                      Unlink
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <div style={{ maxHeight: '300px', marginTop: '10px' }}>
                  {mapKey && (
                    <MapContainer
                      google={google}
                      devicesData={devicesData}
                      invalidLocationDevices={invalidLocationDevices}
                    />
                  )}
                </div>

                {invalidLocationDevices ? (
                  <div style={{ marginTop: '10px' }}>
                    <b>NOTE: </b>Location info of one or more devices could not
                    be retrieved.
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <EmptyDevicesText>
              You do not have any devices connected yet!
            </EmptyDevicesText>
          )}
        </SettingsTabWrapper>
      </React.Fragment>
    );
  }
}

function mapStateToProps(store) {
  return {
    mapKey: store.app.apiKeys.mapKey || '',
    accessToken: store.app.accessToken || '',
    devices: store.settings.devices,
    email: store.app.email,
    userName: store.settings.userName,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({ ...uiActions }, dispatch),
  };
}

const LoadingContainer = props => <CircularLoader height={27} />;

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  GoogleApiWrapper(props => ({
    LoadingContainer: LoadingContainer,
    apiKey: props.mapKey,
  }))(DevicesTab),
);
