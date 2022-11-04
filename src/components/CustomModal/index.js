/* eslint-disable react/prop-types */
import React from 'react';
import styles from './styles.module.scss';

import Close_btn from '../../assets/images/modal_close.png';

const Modal = ({
    open,
    onClose,
    overlayColour,
    children,
    paddingTop = '140px',
}) => {
    if (!open) return null;
    return (
        <div
            onClick={onClose}
            className={styles.overlay}
            style={{ backgroundColor: overlayColour }}
        >
            <div
                onClick={(e) => {
                    e.stopPropagation();
                }}
                className={styles.modalContainer}
                style={{ paddingTop: paddingTop }}
            >
                <div
                    onClick={onClose}
                    style={{
                        background: `url(${Close_btn})`,
                        width: 70,
                        height: 84,
                        right: 30,
                        top: 30,
                        position: 'absolute',
                        backgroundSize: '100%',
                        backgroundRepeat: 'no-repeat',
                    }}
                />
                {children}
            </div>
        </div>
    );
};

export default Modal;
