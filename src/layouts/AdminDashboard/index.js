/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TeamOutlined,
    SlidersOutlined,
    ProfileOutlined,
    RocketOutlined,
} from '@ant-design/icons';

import { useStore } from '../../store';
import { ROUTE_PATH } from '../../constants';
import { SET_COUNTDOWN_VALUE } from '../../store/actions';
import styles from './styles.module.scss';
import CustomModal from '../../components/CustomModal';

import addOnImg from '../../assets/images/right-arrow.png';
import Logo from '../../assets/images/dashboard_icon.png';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { state, dispatch } = useStore();

    const [input, setInput] = useState(parseInt(state.countDownValue));
    const [open, setOpen] = useState(false);

    useEffect(() => {
        console.log(state);
    }, []);

    const goUserList = () => {
        navigate(ROUTE_PATH.user_list);
    };

    const goDifficulityList = () => {
        navigate(ROUTE_PATH.difficulty_list);
    };

    const goRecordList = () => {
        navigate(`${ROUTE_PATH.record_list}/123`);
    };

    const goPrepareWorkout = () => {
        navigate(`${ROUTE_PATH.prepare_workout}/null`);
    };

    const goPersonnelInfo = () => {
        navigate(`${ROUTE_PATH.personnel_info}/new`);
    };

    const onConfirm = () => {
        dispatch({
            type: SET_COUNTDOWN_VALUE,
            payload: input,
        });
        setOpen(false);
    };

    return (
        <div className={styles.container}>
            <legend onClick={() => setOpen(true)}>醫生端</legend>
            <div
                style={{
                    background: `url(${Logo})`,
                    width: 240,
                    height: 270,
                    backgroundSize: '100%',
                    backgroundRepeat: 'no-repeat',
                }}
            />
            <div className={styles.cst_btn} onClick={goUserList}>
                病歷資訊
            </div>
            <div className={styles.cst_btn} onClick={goPrepareWorkout}>
                連線配對
            </div>
            <div className={styles.cst_btn} onClick={goPersonnelInfo}>
                基本資料填寫
            </div>
            <CustomModal
                open={open}
                paddingTop="30px"
                onClose={() => setOpen(false)}
                overlayColour="rgba(243, 151, 0, 50%)"
            >
                <div className={styles.actionWrapper}>
                    <h4>
                        <span>設</span>
                        <span>置</span>
                    </h4>
                    <div className={styles.inputGroup}>
                        <h3>遊戲時間（秒）</h3>
                        <input onChange={(e) => setInput(e.target.value)} type="number" value={input} />
                    </div>
                    <div className={styles.modal_btn} onClick={onConfirm}>
                        確定
                    </div>
                </div>
            </CustomModal>
            <fieldset style={{ display: 'none' }}>
                <TileWithIconAndAction
                    icon={<TeamOutlined />}
                    label="管理會員資訊"
                    action={goUserList}
                />

                <TileWithIconAndAction
                    icon={<SlidersOutlined />}
                    label="騎乘關卡設定"
                    action={goDifficulityList}
                />

                <TileWithIconAndAction
                    icon={<ProfileOutlined />}
                    label="騎乘紀錄查詢"
                    action={goRecordList}
                />

                <TileWithIconAndAction
                    icon={<RocketOutlined />}
                    label="開始騎乘作業"
                    action={goPrepareWorkout}
                />
            </fieldset>
        </div>
    );
};

const TileWithIconAndAction = ({ icon, label, action }) => (
    <span className={styles.tile} onClick={action}>
        <span
            className={styles.addOn}
            style={{ backgroundImage: `url(${addOnImg})` }}
        ></span>
        <span className={styles.tileIcon}>{icon}</span>
        <span className={styles.tileLabel}>{label}</span>
    </span>
);

export default AdminDashboard;
