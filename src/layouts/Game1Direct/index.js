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

import { ROUTE_PATH, GAME_LEVEL } from '../../constants';
import styles from './styles.module.scss';

import Leave_Icon from '../../components/IconLeave';
import Home_Icon from '../../components/IconHome';
import Game_Dir from '../../components/Game1Direct';

import {
    usersRef,
    difficultiesRef,
    recordsRef,
    generateValidPairId,
    validateInputPairId,
} from '../../services/firebase';
import wait from '../../util/wait';

import { useStore } from '../../store';

const Game1Direct = () => {
    const navigate = useNavigate();
    const { state } = useStore();
    const [levelData, setLevelData] = useState([]);

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        const levelData = await fetchLevelData();
        setLevelData(levelData);
        reInitLevelData(levelData);
    };

    const fetchLevelData = async () => {
        const q = query(
            collection(recordsRef, state.currentRecord, GAME_LEVEL.One),
        );

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
        levelData.splice(0, 1); // ??????????????????

        return levelData;
    };

    const reInitLevelData = async (levelData) => {
        console.log(levelData);
        levelData.forEach(async (datum) => {
            const datumRef = doc(
                recordsRef,
                state.currentRecord,
                GAME_LEVEL.One,
                datum.id,
            );
            await deleteDoc(datumRef);
        });
    };

    const goDashboard = async () => {
        if (state.currentRecord) {
            Modal.confirm({
                title: '???????????????',
                icon: <ExclamationCircleOutlined />,
                content: '?????????????????????',
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

    const goGameMoni = async () => {
        await updateDoc(doc(recordsRef, state.currentRecord), {
            currentLevelStart: true,
        });
        navigate(ROUTE_PATH.game1_monitoring);
    };

    return (
        <div className={styles.container}>
            <legend>?????????</legend>
            <div className={styles.leftContainer}>
                <div className={styles.subject}>????????????</div>
                <h2>?????????????????????????????????????????????????????????????????????!</h2>
                <h3>
                    ???????????????????????????????????????????????????????????????????????????????????????!
                </h3>
                <div className={styles.gameDir}>
                    <Game_Dir />
                </div>
            </div>
            <div className={styles.rightContainer}>
                <div className={styles.start} onClick={goGameMoni}>
                    ?????????
                </div>
                <div>
                    <Leave_Icon onClick={goDashboard} />
                </div>
                <div>
                    <Home_Icon onClick={goDashboard} />
                </div>
            </div>
        </div>
    );
};

export default Game1Direct;
