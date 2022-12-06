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
    GAME_LEVEL,
    COLOUR,
    COUNTDOWM_VALUE,
} from '../../constants';
import styles from './styles.module.scss';

import ShapeDot from '../../components/ShapeDot';
import Logo_Icon from '../../components/IconLogo';
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

const Game3Result = () => {
    const navigate = useNavigate();
    const { state } = useStore();
    const [level1Data, setLevel1Data] = useState([]);
    const [level2Data, setLevel2Data] = useState([]);
    const [level3Data, setLevel3Data] = useState([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        const level1Data = await fetchLevelData(GAME_LEVEL.One);
        const level2Data = await fetchLevelData(GAME_LEVEL.Two);
        const level3Data = await fetchLevelData(GAME_LEVEL.Three);
        setLevel1Data(level1Data);
        setLevel2Data(level2Data);
        setLevel3Data(level3Data);
    };

    const fetchLevelData = async (level) => {
        const q = query(collection(recordsRef, state.currentRecord, level));

        const levelData = [];
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            levelData.push({
                ...doc.data(),
                id: doc.id,
            });
        });

        levelData.sort((a, b) => {
            return a.timeStamp?.toDate?.() - b.timeStamp?.toDate?.();
        });
        levelData.splice(0, 1); // 排除掉第一筆

        return levelData;
    };

    const recordFinish = async () => {
        let lv1Score = level1Data.filter((l) => l.correct == true).length;
        let lv2Score = level2Data.filter((l) => l.correct == true).length;
        let lv3Score = level3Data.length;
        const avgScore = ((lv1Score + lv2Score + lv3Score) / 3).toFixed(1);

        const avgCorrectRate = calcAvgCorrectRate();

        await updateDoc(doc(recordsRef, state.currentRecord), {
            onRecordFinish: true,
            avgScore,
            avgCorrectRate,
        });
        navigate(ROUTE_PATH.admin_dashbaord);
    };

    const calcAvgCorrectRate = () => {
        const lv1Correct = level1Data.filter((l) => l.correct == true).length;
        const lv2Correct = level2Data.filter((l) => l.correct == true).length;
        const lv1UnCorrect = level2Data.filter((l) => l.correct == false)
            .length;
        const lv2UnCorrect = level2Data.filter((l) => l.correct == false)
            .length;

        const lv1CorrectRate = lv1Correct / (lv1Correct + lv1UnCorrect);
        const lv2CorrectRate = lv2Correct / (lv2Correct + lv2UnCorrect);

        return ((lv1CorrectRate + lv2CorrectRate) / 2).toFixed(1) * 100;
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
        return level3Data?.length;
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
                    <div className={styles.dotsWrapper}>
                        <ShapeDot fill="#3D4EAE" />
                        <ShapeDot fill="#3D4EAE" />
                        <ShapeDot fill="#3D4EAE" />
                        <ShapeDot fill="#3D4EAE" />
                        <ShapeDot fill="#3D4EAE" />
                    </div>
                    <div className={styles.dotsWrapper}>
                        <ShapeDot fill="#3D4EAE" />
                        <ShapeDot fill="#3D4EAE" />
                        <ShapeDot fill="#3D4EAE" />
                        <ShapeDot fill="#3D4EAE" />
                        <ShapeDot fill="#3D4EAE" />
                    </div>
                </div>
            </div>
            <div className={styles.rightContainer}>
                <div className={styles.logo}>
                    <Logo_Icon />
                </div>
                <div className={styles.action} onClick={goGame3Direct}>
                    重新開始
                </div>
                <div className={styles.action} onClick={() => setOpen(true)}>
                    關卡選擇
                </div>
                <div className={styles.action} onClick={recordFinish}>
                    結束訓練
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
                    {/* <div className={styles.home}>
                        <Home_Icon />
                    </div> */}
                </div>
            </CustomModal>
        </div>
    );
};

export default Game3Result;
