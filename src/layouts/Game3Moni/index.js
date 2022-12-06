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
    Radio,
    Space,
} from 'antd';
import Icon from '@ant-design/icons';
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
    COUNTDOWM_VALUE,
    COLOUR,
} from '../../constants';
import styles from './styles.module.scss';

import Logo from '../../assets/images/dashboard_icon.png';
import CustomModal from '../../components/CustomModal';
import Leave_Icon from '../../components/IconLeave';
import Home_Icon from '../../components/IconHome';
import Logo_Icon from '../../components/IconLogo';

import ShapeDot from '../../components/ShapeDot';

import {
    usersRef,
    difficultiesRef,
    recordsRef,
    generateValidPairId,
    validateInputPairId,
} from '../../services/firebase';
import wait from '../../util/wait';
import { useStore } from '../../store';

const { Countdown } = Statistic;

let unsubscribe = null;

const Game3Moni = () => {
    const navigate = useNavigate();
    const { state } = useStore();
    const [packets, setPackets] = useState([]);
    const [countDown, setCountDown] = useState(
        Date.now() + 1000 * state.countDownValue,
    );

    // for testing
    const [inputPosition, setInputPosition] = useState();

    useEffect(() => {
        init();

        return () => {
            if (_.isFunction(unsubscribe)) unsubscribe();
        };
    }, []);

    const init = async () => {
        console.log(state.currentRecord);
        await updateDoc(doc(recordsRef, state.currentRecord), {
            onBackCurrentReadyPage: false,
        });
        listenPacketsChange();
    };

    const listenPacketsChange = () => {
        const packetsRef = collection(
            recordsRef,
            state.currentRecord,
            GAME_LEVEL.Three,
        );

        unsubscribe = onSnapshot(packetsRef, (querySnapshot) => {
            if (querySnapshot.empty) {
                alert('監測數據有誤，請重新配對，即將退回選擇畫面！');
                navigate(ROUTE_PATH.prepare_workout, { replace: true });
                return;
            }
            const newPackets = [];
            querySnapshot.forEach((doc) => {
                newPackets.push({
                    ...doc.data(),
                    // timeLabel: formatWithMoment(doc.data().time),
                });
            });

            newPackets.sort((a, b) => {
                return a.timeStamp?.toDate?.() - b.timeStamp?.toDate?.();
            });
            newPackets.splice(0, 1);

            setPackets(newPackets);
        });
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

    const goGameDirect = async () => {
        await updateDoc(doc(recordsRef, state.currentRecord), {
            onBackCurrentReadyPage: true, // 退回當前 Direct 畫面
        });
        navigate(ROUTE_PATH.game3_direct);
    };

    const goGameResult = async () => {
        await updateDoc(doc(recordsRef, state.currentRecord), {
            currentLevelStart: false,
        });
        navigate(ROUTE_PATH.game3_result);
    };

    const onFinish = () => {
        console.log('finished');
        goGameResult();
    };

    const shapeColor = (place) => {
        let test = false;
        packets.forEach((p) => {
            if (p.place == place) {
                test = true;
            }
        });

        if (test == true) {
            return COLOUR.Black;
        } else {
            return COLOUR.Default;
        }
    };

    // for prototype testing
    const addTestPacket = async () => {
        const packetsRef = collection(
            recordsRef,
            state.currentRecord,
            GAME_LEVEL.Three,
        );

        const times = packets.length; // 預設會有一筆所以直接取長度即可
        const place = parseInt(inputPosition);
        const timeStamp = Timestamp.now();

        // simulate incoming rpm & heart rate
        const nextPacket = {
            times,
            place,
            timeStamp,
        };

        await addDoc(packetsRef, nextPacket);
    };

    const popoverContent = (
        <>
            <Input.Search
                placeholder="下個點亮的位置是？"
                allowClear
                enterButton="新增"
                size="Large"
                onChange={(e) => setInputPosition(e.target.value)}
                onSearch={addTestPacket}
            />
            {/* <Button onClick={confirmFinish}>結束騎乘</Button> */}
        </>
    );

    const scoreValue = () => {
        return packets.length;
    };

    return (
        <div className={styles.container}>
            <div className={styles.leftContainer}>
                <div className={styles.rightBar} />
                <div className={`${styles.hori} ${styles.separate_top}`} />
                <div className={styles.hori} />
                <div className={styles.dotsWrapper}>
                    <ShapeDot fill={shapeColor(0)} />
                    <ShapeDot fill={shapeColor(1)} />
                    <ShapeDot fill={shapeColor(2)} />
                    <ShapeDot fill={shapeColor(3)} />
                    <ShapeDot fill={shapeColor(4)} />
                    <ShapeDot fill={shapeColor(5)} />
                    <ShapeDot fill={shapeColor(6)} />
                    <ShapeDot fill={shapeColor(7)} />
                    <ShapeDot fill={shapeColor(8)} />
                    <ShapeDot fill={shapeColor(9)} />
                    <ShapeDot fill={shapeColor(10)} />
                    <ShapeDot fill={shapeColor(11)} />
                    <ShapeDot fill={shapeColor(12)} />
                    <ShapeDot fill={shapeColor(13)} />
                    <ShapeDot fill={shapeColor(14)} />
                    <ShapeDot fill={shapeColor(15)} />
                    <ShapeDot fill={shapeColor(16)} />
                    <ShapeDot fill={shapeColor(17)} />
                    <ShapeDot fill={shapeColor(18)} />
                    <ShapeDot fill={shapeColor(19)} />
                    <ShapeDot fill={shapeColor(20)} />
                </div>
                <div className={styles.dotsWrapper}>
                    <ShapeDot fill={shapeColor(21)} />
                    <ShapeDot fill={shapeColor(22)} />
                    <ShapeDot fill={shapeColor(23)} />
                    <ShapeDot fill={shapeColor(24)} />
                    <ShapeDot fill={shapeColor(25)} />
                    <ShapeDot fill={shapeColor(26)} />
                    <ShapeDot fill={shapeColor(27)} />
                    <ShapeDot fill={shapeColor(28)} />
                    <ShapeDot fill={shapeColor(29)} />
                    <ShapeDot fill={shapeColor(30)} />
                    <ShapeDot fill={shapeColor(31)} />
                    <ShapeDot fill={shapeColor(32)} />
                    <ShapeDot fill={shapeColor(33)} />
                    <ShapeDot fill={shapeColor(34)} />
                    <ShapeDot fill={shapeColor(35)} />
                    <ShapeDot fill={shapeColor(36)} />
                    <ShapeDot fill={shapeColor(37)} />
                    <ShapeDot fill={shapeColor(38)} />
                    <ShapeDot fill={shapeColor(39)} />
                    <ShapeDot fill={shapeColor(40)} />
                    <ShapeDot fill={shapeColor(41)} />
                </div>
                <div className={styles.hori} />
                <div className={`${styles.hori} ${styles.separate_bottom}`} />
                <div className={styles.rightBar} />
            </div>
            <div className={styles.rightContainer}>
                <div className={styles.infoWrapper}>
                    <div className={styles.section}>
                        <caption>計時</caption>
                        <div className={styles.contentTime}>
                            <Countdown
                                value={countDown}
                                onFinish={onFinish}
                                format="m:ss"
                                valueStyle={{
                                    color: '#3D4EAE',
                                    fontSize: '32px',
                                    textAlign: 'center',
                                    marginTop: '5px',
                                }}
                            />
                        </div>
                    </div>
                    <div className={styles.section}>
                        <caption>分數</caption>
                        <div className={styles.contentScore}>
                            {scoreValue()}
                        </div>
                    </div>
                </div>
                <div className={styles.actionWrapper}>
                    <Popover
                        content={popoverContent}
                        placement="bottomRight"
                        title="更多操作"
                        trigger="click"
                    >
                        <Logo_Icon />
                    </Popover>
                    <div>
                        <Leave_Icon onClick={goGameDirect} />
                    </div>
                    <div>
                        <Home_Icon onClick={goDashboard} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Game3Moni;
