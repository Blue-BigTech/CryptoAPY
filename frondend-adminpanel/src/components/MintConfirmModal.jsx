import React from "react";
import { Modal } from 'antd';

const MintConfirmModal = ({ visible, onDismiss}) => {

    return (
      <>
        <Modal
          title="Thanks for minting with us!"
          centered
          visible={visible}
          onOk={() => onDismiss()}
          onCancel={() => onDismiss()}
          cancelButtonProps={{ style: { display: 'none' } }}
        >
          <p>It may take a couple minutes for your new transaction to be confirmed.</p>
        </Modal>
      </>
    );
} 

export default MintConfirmModal;