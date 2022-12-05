/* eslint-disable no-unreachable */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    addDoc,
    collection,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    Timestamp,
    getDocs,
    query,
    where,
} from 'firebase/firestore';
import {
    Statistic,
    Layout,
    Form,
    PageHeader,
    Input,
    Button,
    message,
    Modal,
    Select,
    Divider,
    Popover,
    Spin,
    Row,
    Col,
    Descriptions,
    Typography,
    Badge,
} from 'antd';
import {
    LoadingOutlined,
    ExclamationCircleOutlined,
    SettingOutlined,
    ArrowRightOutlined,
} from '@ant-design/icons';
import _ from '../../util/helper';

import {
    ROUTE_PATH,
    COLOUR,
    GAME_LEVEL,
    COUNTDOWM_VALUE,
} from '../../constants';
import styles from './styles.module.scss';

import Logo_Icon from '../../components/IconLogo';
import ShapeCircle from '../../components/ShapeCircle';
import ShapeHexagon from '../../components/ShapeHexagon';
import ShapeSquare from '../../components/ShapeSquare';
import ShapeTriangle from '../../components/ShapeTriangle';
import CustomModal from '../../components/CustomModal';
import Home_Icon from '../../components/IconHome';

import {
    usersRef,
    difficultiesRef,
    recordsRef,
    generateValidPairId,
    validateInputPairId,
} from '../../services/firebase';
import wait from '../../util/wait';

import { useStore } from '../../store';

const Game2Result = () => {
    const navigate = useNavigate();
    const { state } = useStore();
    const [levelData, setLevelData] = useState([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        const levelData = await fetchLevelData();
        setLevelData(levelData);
    };

    const fetchLevelData = async () => {
        const q = query(
            collection(recordsRef, state.currentRecord, GAME_LEVEL.Two),
        );

        const levelData = [];
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            levelData.push({
                ...doc.data(),
                id: doc.id,
            });
        });

        levelData.sort((a, b) => a.timeStamp - b.timeStamp);
        levelData.splice(0, 1); // 排除掉第一筆

        return levelData;
    };

    const goDashboard = async () => {
        if (state.currentRecord) {
            Modal.confirm({
                title: '即將離開！',
                icon: <ExclamationCircleOutlined />,
                content: '將刪除所選資訊',
                onOk: () => deleteRecord('leave'),
            });
        } else {
            navigate(ROUTE_PATH.admin_dashbaord);
        }
    };

    const deleteRecord = async (leave = false) => {
        const targetRecordRef = doc(recordsRef, state.currentRecord);
        await deleteDoc(targetRecordRef);
        if (leave) navigate(ROUTE_PATH.admin_dashbaord);
    };

    const goGame1Direct = async () => {
        await updateDoc(doc(recordsRef, state.currentRecord), {
            readyPage: GAME_LEVEL.One,
        });
        navigate(ROUTE_PATH.game1_direct);
    };

    const goGame2Direct = async () => {
        await updateDoc(doc(recordsRef, state.currentRecord), {
            readyPage: GAME_LEVEL.Two,
        });
        navigate(ROUTE_PATH.game2_direct);
    };

    const goGame3Direct = async () => {
        await updateDoc(doc(recordsRef, state.currentRecord), {
            readyPage: GAME_LEVEL.Three,
        });
        navigate(ROUTE_PATH.game3_direct);
    };

    const scoreValue = () => {
        return levelData.filter((l) => l?.correct == true).length;
    };

    const redCount = () => {
        return levelData.filter(
            (l) => l?.correct == true && l?.ansColor == COLOUR.Red,
        ).length;
    };

    const blueCount = () => {
        return levelData.filter(
            (l) => l?.correct == true && l?.ansColor == COLOUR.Blue,
        ).length;
    };

    const yellowCount = () => {
        return levelData.filter(
            (l) => l?.correct == true && l?.ansColor == COLOUR.Yellow,
        ).length;
    };

    const unCorrect = () => {
        return levelData.filter((l) => l?.correct == false).length;
    };

    const countDownDisplay = () => {
        let min = Math.floor(state.countDownValue / 60);
        let sec = state.countDownValue - min * 60;

        let minDisplay = min < 10 ? '0' + min : min;
        let secDisplay = sec < 10 ? '0' + sec : sec;

        return `${minDisplay}:${secDisplay}`;
    };

    return (
        <div className={styles.container}>
            <legend>醫生端</legend>
            <div className={styles.leftContainer}>
                <div className={`${styles.infoBlock} ${styles.time}`}>
                    <h2>{countDownDisplay()}</h2>
                    <h3>花費時間</h3>
                </div>
                <div className={`${styles.infoBlock} ${styles.score}`}>
                    <div>
                        <h1>{scoreValue()}</h1>
                        <h3>得分</h3>
                    </div>
                </div>
                <div className={`${styles.infoBlock} ${styles.detail}`}>
                    <div className={styles.singleInfoWrapper}>
                        <div className={styles.shapeWrapper}>
                            <ShapeHexagon
                                fill="#FD6B6B"
                                width="100%"
                                height="100%"
                            />
                            <h4>{redCount()}</h4>
                        </div>
                    </div>
                    <div className={styles.singleInfoWrapper}>
                        <div className={styles.shapeWrapper}>
                            <ShapeCircle
                                fill="#6CB3F3"
                                width="100%"
                                height="100%"
                            />
                            <h4>{blueCount()}</h4>
                        </div>
                    </div>
                    <div className={styles.singleInfoWrapper}>
                        <div className={styles.shapeWrapper}>
                            <ShapeSquare
                                fill="#F6D735"
                                width="100%"
                                height="100%"
                            />
                            <h4>0</h4>
                        </div>
                    </div>
                    {/* <div className={styles.singleInfoWrapper}>
                        <div className={styles.shapeWrapper}>
                            <ShapeTriangle
                                fill="#F6D735"
                                width="100%"
                                height="100%"
                                styles={{
                                    transform: 'rotate(90deg) scale(0.9)',
                                }}
                            />
                            <h4>1</h4>
                        </div>
                    </div> */}
                </div>
            </div>
            <div className={styles.rightContainer}>
                <div className={styles.logo}>
                    <Logo_Icon onClick={goDashboard} />
                </div>
                <div className={styles.action} onClick={goGame2Direct}>
                    重新開始
                </div>
                <div className={styles.action} onClick={goGame3Direct}>
                    下一關卡
                </div>
                <div className={styles.action} onClick={() => setOpen(true)}>
                    關卡選擇
                </div>
            </div>
            <CustomModal
                open={open}
                paddingTop="30px"
                onClose={() => setOpen(false)}
                overlayColour="rgba(243, 151, 0, 50%)"
            >
                <div className={styles.actionWrapper}>
                    <h4>
                        <span>關</span>
                        <span>卡</span>
                        <span>選</span>
                        <span>擇</span>
                    </h4>
                    <div style={{ margin: '0.8em', width: '16%' }}>
                        <Logo_Icon />
                    </div>
                    <div className={styles.modal_btn} onClick={goGame1Direct}>
                        圓柱練習
                    </div>
                    <div className={styles.modal_btn} onClick={goGame2Direct}>
                        多元練習
                    </div>
                    <div className={styles.modal_btn} onClick={goGame3Direct}>
                        細圓柱練習
                    </div>
                    <div className={styles.home}>
                        <Home_Icon />
                    </div>
                </div>
            </CustomModal>
        </div>
    );
};

export default Game2Result;
