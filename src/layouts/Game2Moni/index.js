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
    COLOUR,
    COUNTDOWM_VALUE,
} from '../../constants';
import styles from './styles.module.scss';

import Logo from '../../assets/images/dashboard_icon.png';
import CustomModal from '../../components/CustomModal';
import Leave_Icon from '../../components/IconLeave';
import Home_Icon from '../../components/IconHome';
import Logo_Icon from '../../components/IconLogo';

import ShapeCircle from '../../components/ShapeCircle';
import ShapeHexagon from '../../components/ShapeHexagon';
import ShapeSquare from '../../components/ShapeSquare';
import ShapeTriangle from '../../components/ShapeTriangle';
import ShapeRectangle from '../../components/ShapeRectangle';

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

const Game2Moni = () => {
    const navigate = useNavigate();
    const { state } = useStore();
    const [packets, setPackets] = useState([]);
    const [latestPacket, setLatestPakcet] = useState();
    const [countDown, setCountDown] = useState(
        Date.now() + 1000 * state.countDownValue,
    );

    // for testing
    const [inputPosition, setInputPosition] = useState();
    const [inputColor, setInputColor] = useState();

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
            onRechooseGameLevel: '',
        });
        listenPacketsChange();
    };
    const listenPacketsChange = () => {
        const packetsRef = collection(
            recordsRef,
            state.currentRecord,
            GAME_LEVEL.Two,
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

            const latestPacket = newPackets[newPackets.length - 1];

            setPackets(newPackets);
            setLatestPakcet(latestPacket);
        });
    };

    const forceLeave = async () => {
        await updateDoc(doc(recordsRef, state.currentRecord), {
            onRecordFinish: true,
        });
    };

    const goDashboard = async () => {
        if (state.currentRecord) {
            Modal.confirm({
                title: '即將離開！',
                icon: <ExclamationCircleOutlined />,
                content: '將刪除所選資訊',
                onOk: () => deleteRecord(),
            });
        } else {
            navigate(ROUTE_PATH.admin_dashbaord);
        }
    };

    const deleteRecord = async () => {
        const targetRecordRef = doc(recordsRef, state.currentRecord);
        await forceLeave();
        await wait(1500);
        await deleteDoc(targetRecordRef);
        navigate(ROUTE_PATH.admin_dashbaord);
    };

    const goGameDirect = async () => {
        await updateDoc(doc(recordsRef, state.currentRecord), {
            onBackCurrentReadyPage: true, // 退回當前 Direct 畫面
        });
        navigate(ROUTE_PATH.game2_direct);
    };

    const goGameResult = async () => {
        await updateDoc(doc(recordsRef, state.currentRecord), {
            currentLevelStart: false,
        });
        navigate(ROUTE_PATH.game2_result);
    };

    const onFinish = () => {
        console.log('finished');
        goGameResult();
    };

    const shapeColor = (position) => {
        if (latestPacket?.position == position) {
            if (latestPacket.ansColor === '') {
                return COLOUR.Default; // 沒放的情形
            }
            return latestPacket.ansColor;
        }
        return COLOUR.Default;
    };

    // for prototype testing
    const addTestPacket = async () => {
        const packetsRef = collection(
            recordsRef,
            state.currentRecord,
            GAME_LEVEL.Two,
        );

        const times = packets.length; // 預設會有一筆所以直接取長度即可
        const position = parseInt(inputPosition);
        const ansColor = inputColor; // 只會得到回答後的顏色
        const timeStamp = Timestamp.now();
        const correct = true; // 代表有放置正確，測試階段皆正確

        // simulate incoming rpm & heart rate
        const nextPacket = {
            times,
            position,
            ansColor,
            timeStamp,
            correct,
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
            <Radio.Group
                onChange={(e) => setInputColor(e.target.value)}
                value={inputColor}
            >
                <Space direction="vertical">
                    <Radio value={COLOUR.Red}>#ff70a7(紅)</Radio>
                    <Radio value={COLOUR.Blue}>#70d6ff(藍)</Radio>
                </Space>
            </Radio.Group>
            {/* <Button onClick={confirmFinish}>結束騎乘</Button> */}
        </>
    );

    const scoreValue = () => {
        return packets.filter((p) => p.correct == true).length;
    };

    return (
        <div className={styles.container}>
            <div className={styles.leftContainer}>
                <ShapeCircle fill={shapeColor(0)} />
                <ShapeSquare fill={shapeColor(3)} />
                <ShapeTriangle
                    fill={shapeColor(6)}
                    styles={{ transform: 'rotate(180deg)' }}
                />
                <ShapeRectangle fill={shapeColor(9)} />
                <ShapeHexagon fill={shapeColor(12)} />

                <ShapeCircle fill={shapeColor(1)} />
                <ShapeSquare fill={shapeColor(4)} />
                <ShapeTriangle
                    fill={shapeColor(7)}
                    styles={{ transform: 'rotate(180deg)' }}
                />
                <ShapeRectangle fill={shapeColor(10)} />
                <ShapeHexagon fill={shapeColor(13)} />

                <ShapeCircle fill={shapeColor(2)} />
                <ShapeSquare fill={shapeColor(5)} />
                <ShapeTriangle
                    fill={shapeColor(8)}
                    styles={{ transform: 'rotate(180deg)' }}
                />
                <ShapeRectangle fill={shapeColor(11)} />
                <ShapeHexagon fill={shapeColor(14)} />

                {/* 
                <ShapeHexagon fill={shapeColor(0)} />
                <ShapeRectangle fill={shapeColor(3)} />
                <ShapeTriangle
                    fill={shapeColor(6)}
                    styles={{ transform: 'rotate(180deg)' }}
                />
                <ShapeSquare fill={shapeColor(9)} />
                <ShapeCircle fill={shapeColor(12)} />

                <ShapeHexagon fill={shapeColor(1)} />
                <ShapeRectangle fill={shapeColor(4)} />
                <ShapeTriangle
                    fill={shapeColor(7)}
                    styles={{ transform: 'rotate(180deg)' }}
                />
                <ShapeSquare fill={shapeColor(10)} />
                <ShapeCircle fill={shapeColor(13)} />

                <ShapeHexagon fill={shapeColor(2)} />
                <ShapeRectangle fill={shapeColor(5)} />
                <ShapeTriangle
                    fill={shapeColor(8)}
                    styles={{ transform: 'rotate(180deg)' }}
                />
                <ShapeSquare fill={shapeColor(11)} />
                <ShapeCircle fill={shapeColor(14)} /> */}
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

export default Game2Moni;
