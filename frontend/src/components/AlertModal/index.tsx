import React from 'react';
import {Modal as BsModal, Button} from 'react-bootstrap';
import './index.scss';

const AlertModal = (props) => {
    return (
        <BsModal
            {...props}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered>
            <BsModal.Body>
                <p>{props.alertmodaltext}</p>
            </BsModal.Body>
            <BsModal.Footer>
                <Button onClick={props.onHide}>Close</Button>
            </BsModal.Footer>
        </BsModal>
    );
};

export default AlertModal;