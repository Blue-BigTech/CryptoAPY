import { Skeleton } from 'antd';
import * as React from 'react';
import { Row, Col } from 'react-bootstrap';
import Countdown from 'react-countdown';
import { paddingTwoDigits } from '../../utils/convert';
import './Time.scss';

const Time = ({ icoInfo }) => {
  const [leftTime, setTargetTimestamp] = React.useState<number>(60000);
  React.useEffect(() => {
    setTargetTimestamp(icoInfo ? (icoInfo.icoStartedAt + icoInfo.icoPeriod - icoInfo.currentTime) * 1000 : 60000);
  }, [icoInfo?.currentTime]);

  interface Props {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    completed: boolean;
  }

  const renderer: React.FC<Props> = ({ days, hours, minutes, seconds }) => {
    return (
      <Row className='custom-timer color-white'>
        <Col xs={6} sm={3} className='customer-timer-block'>
          <div className='customer-timer-time'>{paddingTwoDigits(days)}</div>
          <div className='customer-timer-uint'>Days</div>
        </Col>
        <Col xs={6} sm={3} className='customer-timer-block'>
          <div className='customer-timer-time'>{paddingTwoDigits(hours)}</div>
          <div className='customer-timer-uint'>Hours</div>
        </Col>
        <Col xs={6} sm={3} className='customer-timer-block'>
          <div className='customer-timer-time'>{paddingTwoDigits(minutes)}</div>
          <div className='customer-timer-uint'>Mins</div>
        </Col>
        <Col xs={6} sm={3} className='customer-timer-block'>
          <div className='customer-timer-time'>{paddingTwoDigits(seconds)}</div>
          <div className='customer-timer-uint'>Secs</div>
        </Col>
      </Row>
    );
  };

  return (
    icoInfo ? (
      <Countdown date={Date.now() + leftTime} renderer={renderer} />
    ) : (
      <div className='mb-5 text-center'>
        <Skeleton.Input active size='large' />
      </div>
    )
  );
};

export default Time;