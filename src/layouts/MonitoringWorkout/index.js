/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    onSnapshot,
    collection,
    addDoc,
    doc,
    updateDoc,
    Timestamp,
    getDoc,
} from 'firebase/firestore';
import moment from 'moment';
import { DualAxes as LineChart } from '@ant-design/plots';
import { Modal, Popover, Button, Input, message, notification } from 'antd';
import {
    SettingOutlined,
    ExclamationCircleOutlined,
    SmileOutlined,
} from '@ant-design/icons';

import { ROUTE_PATH, WARN, WARN_THRESHOLD } from '../../constants';
import styles from './styles.module.scss';
import _ from '../../util/helper';

import { recordsRef, usersRef, difficultiesRef } from '../../services/firebase';
import wait from '../../util/wait';
// import useAudio from '../../util/useAudio';
import formatWithMoment from '../../util/formatSeconds';
import configLineChart from '../../util/configLineChart';

import StopWatch from '../../components/StopWatch';

let unsubscribeRecord = null;
let unsubscribePackets = null;

const warn_slight_url = '/assets/sounds/warn-slight.wav';
const warn_medium_url = '/assets/sounds/warn-medium.wav';
const warn_high_url = '/assets/sounds/warn-high.wav';
const other_notification_url = '/assets/sounds/notification.wav';
const other_archieved_url = '/assets/sounds/goal-archieved.wav';

const https_yodel =
    'https://s3-us-west-2.amazonaws.com/s.cdpn.io/123941/Yodel_Sound_Effect.mp3';

//:
//:
//:
var AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext(); // Make it crossbrowser
var gainNode = context.createGain();
gainNode.gain.value = 1; // set volume to 100%
var yodelBuffer; // slight
var yodelBuffer2; // medium
var yodelBuffer3; // high
var yodelBuffer4; // archieved
var yodelBuffer5; // notfication
//:
//:
//:

const MonitoringWorkout = () => {
    const navigate = useNavigate();
    const params = useParams();

    const [record, setRecord] = useState();
    const [user, setUser] = useState();
    const [difficulty, setDifficulty] = useState();
    const [packets, setPackets] = useState([]);

    const [isInitRecordDone, setIsInitRecordDone] = useState(false);
    const [isInitPacketsDone, setIsInitPacketsDone] = useState(false);

    const [isBuffersDone, setIsBuffersDone] = useState(false);

    // const {
    //     playWarnSound,
    //     playOtherSound,
    //     OTHER_SOUND,
    //     getAudioPermission,
    // } = useAudio();

    // ??????????????????
    const [beginStopWatch, setBeginStopWatch] = useState(false);

    // for prototype
    const [nextHeartRateVal, setNextHeartRateVal] = useState('');

    useEffect(() => {
        init();
        fetchBuffers();

        return () => {
            if (_.isFunction(unsubscribeRecord)) unsubscribeRecord();
            if (_.isFunction(unsubscribePackets)) unsubscribePackets();
        };
    }, []);

    useEffect(() => {
        if (
            isInitRecordDone &&
            isInitPacketsDone &&
            !_.isEmpty(difficulty) &&
            isBuffersDone
        ) {
            grantAudioPerssion();
        }
    }, [isInitRecordDone, isInitPacketsDone, difficulty, isBuffersDone]);

    useEffect(() => {
        if (_.isEmpty(record?.beginWorkoutTime)) return;

        const begin = record.beginWorkoutTime;
        const end = record.finishedWorkoutTime;

        if (_.isNotEmpty(begin)) setBeginStopWatch(true);
        if (_.isNotEmpty(end)) setBeginStopWatch(false);
    }, [record]);

    useEffect(() => {
        if (_.isEmpty(record)) return;
        if (!isInitRecordDone || !isInitPacketsDone) return;

        evaluateCurrPacket(packets[packets.length - 1]);
    }, [packets]);

    const init = async () => {
        checkIntegrity();
        listenRecordChange();
        listenPacketsChange();
    };

    const fetchBuffers = async () => {
        let response;
        let arrayBuffer;

        response = await fetch(warn_slight_url);
        arrayBuffer = await response.arrayBuffer();
        context.decodeAudioData(
            arrayBuffer,
            (audioBuffer) => {
                yodelBuffer = audioBuffer;
            },
            (error) => console.error(error),
        );

        response = await fetch(warn_medium_url);
        arrayBuffer = await response.arrayBuffer();
        context.decodeAudioData(
            arrayBuffer,
            (audioBuffer) => {
                yodelBuffer2 = audioBuffer;
            },
            (error) => console.error(error),
        );

        response = await fetch(warn_high_url);
        arrayBuffer = await response.arrayBuffer();
        context.decodeAudioData(
            arrayBuffer,
            (audioBuffer) => {
                yodelBuffer3 = audioBuffer;
            },
            (error) => console.error(error),
        );

        response = await fetch(other_archieved_url);
        arrayBuffer = await response.arrayBuffer();
        context.decodeAudioData(
            arrayBuffer,
            (audioBuffer) => {
                yodelBuffer4 = audioBuffer;
            },
            (error) => console.error(error),
        );

        response = await fetch(other_notification_url);
        arrayBuffer = await response.arrayBuffer();
        context.decodeAudioData(
            arrayBuffer,
            (audioBuffer) => {
                yodelBuffer5 = audioBuffer;
            },
            (error) => console.error(error),
        );

        setIsBuffersDone(true);
    };

    const playAudio = (buffer) => {
        var source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.start();
    };

    const grantAudioPerssion = () => {
        Modal.info({
            title: '?????????????????????????????????????????????????????????????????????',
            // content: <button onClick={getAudioPermission}>????????????;</button>,
            onOk() {
                playAudio(yodelBuffer5);
            },
            maskClosable: false,
        });
    };

    const formatBeginWorkoutTime = () => {
        if (_.isEmpty(record.beginWorkoutTime)) {
            return '';
        }

        return moment(record.beginWorkoutTime).format('YYYY/MM/DD HH:mm');
    };

    const checkIntegrity = async () => {
        const recordRef = doc(recordsRef, params.recordId);
        const recordSnapshot = await getDoc(recordRef);
        const recordData = recordSnapshot.data();
        // check if a valid record
        if (recordData.finishedWorkoutTime != null) {
            alert('????????????????????????????????????????????????');
            navigate(ROUTE_PATH.admin_dashbaord);
        }

        // user
        const userRef = doc(usersRef, recordData.user);
        const userSnapshot = await getDoc(userRef);
        const user = userSnapshot.data();

        // difficulty
        const difficultyRef = doc(difficultiesRef, recordData.difficulty);
        const diffSnapshot = await getDoc(difficultyRef);
        const difficulty = diffSnapshot.data();

        setUser(user);
        setDifficulty(difficulty);
    };

    const listenRecordChange = async () => {
        const recordRef = doc(recordsRef, params.recordId);
        unsubscribeRecord = onSnapshot(recordRef, async (recordSnapshot) => {
            const recordData = recordSnapshot.data();
            const record = {
                ...recordData,
                beginWorkoutTime: recordData.beginWorkoutTime?.toDate(),
            };

            setRecord(record);
            setIsInitRecordDone(true);
        });
    };

    const listenPacketsChange = () => {
        const packetsRef = collection(recordsRef, params.recordId, 'packets');

        unsubscribePackets = onSnapshot(packetsRef, (querySnapshot) => {
            if (querySnapshot.empty) {
                alert('??????????????????????????????????????????????????????????????????');
                navigate(ROUTE_PATH.prepare_workout, { replace: true });
                return;
            }
            const newPackets = [];
            querySnapshot.forEach((doc) => {
                newPackets.push({
                    ...doc.data(),
                    timeLabel: formatWithMoment(doc.data().time),
                });
            });

            newPackets.sort((a, b) => a.time - b.time);
            newPackets.splice(0, 1);

            setPackets(newPackets);
            setIsInitPacketsDone(true);
        });
    };

    const evaluateCurrPacket = (packet) => {
        const targetHeartRate = record.targetHeartRate;
        const [overSlight, overMedium, overHigh] = getExactThresholdValue();

        console.log(packet);

        if (packet.heartRate >= overHigh) {
            console.log('playing: high warn');
            playAudio(yodelBuffer3);
            sendNotification(WARN.High, packet.heartRate);
        } else if (
            packet.heartRate < overHigh &&
            packet.heartRate >= overMedium
        ) {
            console.log('playing: medium warn');
            playAudio(yodelBuffer2);
            sendNotification(WARN.Medium, packet.heartRate);
        } else if (
            packet.heartRate < overMedium &&
            packet.heartRate >= overSlight
        ) {
            console.log('playing: slight warn');
            playAudio(yodelBuffer);
            sendNotification(WARN.Slight, packet.heartRate);
        } else if (
            packet.heartRate >= targetHeartRate &&
            packet.heartRate < overSlight
        ) {
            console.log('playing: archieved');
            playAudio(yodelBuffer4);
            sendNotification('Archieved', packet.heartRate, targetHeartRate);
        }
    };

    const getExactThresholdValue = () => {
        const upperLimitHeartRate = record.upperLimitHeartRate;

        const calBase = upperLimitHeartRate / 100;
        const overHigh = Math.ceil(calBase * WARN_THRESHOLD.High);
        const overMedium = Math.ceil(calBase * WARN_THRESHOLD.Medium);
        const overSlight = Math.ceil(calBase * WARN_THRESHOLD.Slight);

        return [overSlight, overMedium, overHigh];
    };

    // for prototype testing
    const addRpmAndHeartRate = async () => {
        // set the begin time
        const recordRef = doc(recordsRef, params.recordId);
        const recordSnapshot = await getDoc(recordRef);
        const record = recordSnapshot.data();
        if (record.beginWorkoutTime == null) {
            await updateDoc(recordRef, {
                beginWorkoutTime: Timestamp.now(),
            });
        }

        const packetsRef = collection(recordsRef, params.recordId, 'packets');

        const time = (packets.length + 1) * 5;
        const heartRate = _.isNotEmpty(nextHeartRateVal)
            ? parseInt(nextHeartRateVal)
            : 95 + packets.length;

        // simulate incoming rpm & heart rate
        const rpm = 30;
        const nextPacket = {
            time,
            rpm: rpm + packets.length,
            heartRate: heartRate,
        };

        await addDoc(packetsRef, nextPacket);
    };

    const confirmFinish = () => {
        Modal.confirm({
            title: '???????????????',
            icon: <ExclamationCircleOutlined />,
            content: '???????????????????????????',
            onOk: () => goFinishWorkout(),
        });
    };

    const goFinishWorkout = async () => {
        setBeginStopWatch(false);

        await wait(2000);
        const recordRef = doc(recordsRef, params.recordId);
        await updateDoc(recordRef, {
            finishedWorkoutTime: Timestamp.now(),
            pairId: null,
        });

        message.success({ content: '???????????????????????????????????????' });

        await wait(1000);
        navigate(`${ROUTE_PATH.finsished_workout}/${params.recordId}`, {
            replace: true,
        });
    };

    const getStopWatchInitialValue = () => {
        if (_.isEmpty(record?.beginWorkoutTime)) {
            return 0;
        }

        const begin = moment(record.beginWorkoutTime);
        const now = moment();
        const accumlated = moment.duration(now.diff(begin)).asMilliseconds();

        return accumlated;
    };

    // ?????????????????????
    const sendNotification = (warn, heartRate, targetHeartRate) => {
        if (warn === WARN.High) {
            // high warn
            notification.warn({
                message: '???????????????????????????????????????????????????',
                description: `????????????????????????????????????????????????${heartRate} BPM???`,
            });
        } else if (warn === WARN.Medium) {
            // medium warn
            notification.info({
                message: '???????????????????????????????????????????????????',
                description: `????????????????????????????????????????????????${heartRate} BPM???`,
            });
        } else if (warn === WARN.Slight) {
            // slight warn
            notification.open({
                message: '??????????????????',
                description: `????????????????????????????????????????????????${heartRate} BPM???`,
                icon: <SmileOutlined style={{ color: '#108ee9' }} />,
            });
        } else {
            // archived
            notification.success({
                message: '?????????????????????????????????',
                description: `???????????????????????????${targetHeartRate} BPM?????????????????????${heartRate} BPM???`,
            });
        }
    };

    if (
        !isInitRecordDone ||
        !isInitPacketsDone ||
        _.isEmpty(difficulty) ||
        !isBuffersDone
    ) {
        return <div className={styles.container}>????????????????????????...</div>;
    }

    const popoverContent = (
        <>
            <Input.Search
                placeholder="??????????????????"
                allowClear
                enterButton="??????"
                size="Large"
                onChange={(e) => setNextHeartRateVal(e.target.value)}
                onSearch={addRpmAndHeartRate}
            />
            <Button onClick={confirmFinish}>????????????</Button>
        </>
    );

    console.log(record.targetHeartRate);

    // TODO:
    // refactoring <table> to component
    return (
        <div className={styles.container}>
            <audio id="audio" src={other_notification_url} muted></audio>
            <div className={styles.glass}>
                {/* <h1>??????????????????</h1> */}
                <div className={`${styles.col} ${styles.col1}`}>
                    <span>????????????{user?.name}</span>
                    <span>????????????????????????{user?.age}</span>
                </div>
                <div className={`${styles.col} ${styles.col2}`}>
                    <div className={styles.stopWatchWrapper}>
                        <span>??????????????????</span>
                        <StopWatch
                            start={beginStopWatch}
                            initialValue={getStopWatchInitialValue()}
                        />
                    </div>
                    <caption>(????????? {formatBeginWorkoutTime()})</caption>
                </div>
                <div className={`${styles.col} ${styles.col3}`}>
                    <span>???????????????20 <span className={styles.unit}>RPM</span></span>
                    <span>???????????????30 <span className={styles.unit}>BPM</span></span>
                    <span>???????????????23 <span className={styles.unit}>WATTS</span></span>
                    <span>?????????????????????12 <span className={styles.unit}>CAL</span></span>
                </div>
                <div className={`${styles.col} ${styles.difficulty}`}>
                    <Popover
                        content={popoverContent}
                        placement="bottomRight"
                        title="????????????"
                        trigger="click"
                    >
                        <SettingOutlined width={'1em'} />
                    </Popover>
                    <span>???????????????{difficulty.name}</span>
                    <span>???????????????{difficulty.targetHeartRate}</span>
                    <span>???????????????{difficulty.upperLimitHeartRate}</span>
                    <caption>
                        ?????????????????????{getExactThresholdValue()[0]}/
                        {getExactThresholdValue()[1]}/
                        {getExactThresholdValue()[2]}
                    </caption>
                </div>
                <div className={styles.mainCol}>
                    <LineChart
                        {...configLineChart(packets, record.targetHeartRate)}
                    />
                </div>
            </div>
        </div>
    );
};

export default MonitoringWorkout;
