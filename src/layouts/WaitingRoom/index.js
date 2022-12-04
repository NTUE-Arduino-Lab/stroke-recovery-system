/* eslint-disable no-unreachable */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    addDoc,
    collection,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    Timestamp,
} from 'firebase/firestore';
import { Statistic, Input, message, Popover } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import _ from '../../util/helper';

import { ROUTE_PATH, VALID_MIN, WARN_THRESHOLD, WARN } from '../../constants';
import styles from './styles.module.scss';

import Leave_Icon from '../../assets/images/leave_icon.png';
import Logo from '../../assets/images/page_icon.png';
import CustomModal from '../../components/CustomModal';

import {
    recordsRef,
    generateValidPairId,
    validateInputPairId,
} from '../../services/firebase';
import { useStore } from '../../store';
import { SET_CUR_RECORD } from '../../store/actions';
import wait from '../../util/wait';

const { Countdown } = Statistic;

// TODO: 新增每關卡初始數據
const initialLevelData = {
    ansColor: '#D9D9D9',
    timeStamp: Date.now(),
};

let unsubscribe = null;

const WaitingRoom = () => {
    const navigate = useNavigate();
    const { state, dispatch } = useStore();
    const params = useParams();

    const [isDone, setIsDone] = useState(false);

    const [isPairing, setIsPairing] = useState(false);

    const [targetgetRecordId, setTargetRecordId] = useState();

    const [pairId, setPairId] = useState(); // 產生的不重複配對碼
    const [isAppConnected, setIsAppConnected] = useState(false);
    const [pairDeadline, setPairDeadline] = useState();

    // for functionality testing
    const [inputPairId, setInputPairId] = useState(''); // 輸入的配對碼

    //
    /// 針對中風復健新增的內容
    ////
    /////
    const [open, setOpen] = useState(false);
    //
    ///
    ////
    /////

    //
    /// 針對中風復健新增的內容
    ////
    /////
    useEffect(() => {
        if (params?.action == 'open-modal') {
            setOpen(true);
        }
    }, [params]);
    //
    ///
    ////
    /////

    useEffect(() => {
        init();

        return () => {
            if (_.isFunction(unsubscribe)) unsubscribe();
        };
    }, []);

    const init = async () => {
        await wait(3000);
        const user = state.currentUser;
        if (!user) {
            message.error('伺服器異常，前往主畫面');
            await wait(3000);
            goDashboard();
        }

        setIsDone(true);
        createRecord();
    };

    useEffect(() => {
        if (_.isEmpty(targetgetRecordId)) {
            return;
        }

        const targetRecordRef = doc(recordsRef, targetgetRecordId);
        unsubscribe = onSnapshot(targetRecordRef, async (doc) => {
            const currData = doc.data();
            if (currData?.pairId == null) {
                // App 端連線後，會將 pairId 設成 null
                // 藉由監聽是否為 null，判斷是否連上
                // 若連上更新 record 的 [isAppConnected] 為 true
                if (currData?.isAppConnected == false) {
                    await updateDoc(targetRecordRef, {
                        isAppConnected: true,
                    });

                    setPairDeadline(null);
                    setIsPairing(false);
                    setIsAppConnected(true);

                    dispatch({
                        type: SET_CUR_RECORD,
                        payload: targetgetRecordId,
                    });
                    message.success('配對成功，您可以前往監視畫面了！');
                }
            }
        });

        // going to listen doc change!
    }, [targetgetRecordId]);

    const goDashboard = async () => {
        await deleteRecord();
        navigate(ROUTE_PATH.admin_dashbaord);
    };

    const goGame1Direct = async () => {
        await updateDoc(doc(recordsRef, state.currentRecord), {
            readyPage: 'level1',
        });
        navigate(ROUTE_PATH.game1_direct);
    };

    const goGame2Direct = async () => {
        await updateDoc(doc(recordsRef, state.currentRecord), {
            readyPage: 'level2',
        });
        navigate(ROUTE_PATH.game2_direct);
    };

    const goGame3Direct = async () => {
        await updateDoc(doc(recordsRef, state.currentRecord), {
            readyPage: 'level3',
        });
        navigate(ROUTE_PATH.game3_direct);
    };

    const createRecord = async () => {
        const user = state.currentUser;
        const pairId = await generateValidPairId();
        const isAppConnected = false;
        const createdTime = Timestamp.now();
        const beginWorkoutTime = null;
        const finishedWorkoutTime = null;

        const targetRecordRef = await addDoc(recordsRef, {
            pairId,
            isAppConnected,
            user,
            createdTime,
            beginWorkoutTime,
            finishedWorkoutTime,
        });
        console.log('Document written with ID: ', targetRecordRef.id);

        // 初始化 3關 資料
        await addDoc(
            collection(recordsRef, targetRecordRef.id, 'level1'),
            initialLevelData,
        );
        await addDoc(
            collection(recordsRef, targetRecordRef.id, 'level2'),
            initialLevelData,
        );
        await addDoc(
            collection(recordsRef, targetRecordRef.id, 'level3'),
            initialLevelData,
        );

        setTargetRecordId(targetRecordRef.id);
        setPairId(pairId);

        // start a count-down
        const deadline = Date.now() + 1000 * 60 * VALID_MIN;
        setPairDeadline(deadline);

        message.info({ content: '配對碼已生成！請在時間內進行配對！' }, 5);
    };

    const deleteRecord = async (leave = false) => {
        const targetRecordRef = doc(recordsRef, targetgetRecordId);
        await deleteDoc(targetRecordRef);
        if (leave) navigate(ROUTE_PATH.admin_dashbaord);
    };

    // for functionality testing
    const pairWithApp = async () => {
        setIsPairing(true);

        const theRecordId = await validateInputPairId(inputPairId);

        if (!theRecordId) {
            alert('配對碼有誤或非本次記錄的配對碼');
            setIsPairing(false);
            setIsAppConnected(false);
            return;
        }

        // update the isAppConnected Field!
        const targetRecordRef = doc(recordsRef, theRecordId);
        await wait(1500);
        await updateDoc(targetRecordRef, {
            pairId: null,
        });
    };

    const onDeadlineExpired = async () => {
        message.warn('連結過期，重新配對', 3);

        await wait(1000);
        await deleteRecord();
        setTargetRecordId(null);
        setPairId(null);
        setPairDeadline(null);
        setInputPairId(null);
        createRecord();
    };

    const simulateAppCotent = (
        <div className={styles.pairing}>
            <Input.Search
                placeholder="手動輸入配對碼"
                allowClear
                value={inputPairId}
                onChange={(e) => setInputPairId(e.target.value)}
                onSearch={pairWithApp}
                disabled={isAppConnected}
                loading={isPairing}
            />
        </div>
    );

    return (
        <div className={styles.container}>
            <div
                style={{
                    background: `url(${Logo})`,
                    width: 258,
                    height: 56,
                    left: 24,
                    top: 20,
                    position: 'absolute',
                    backgroundSize: '100%',
                    backgroundRepeat: 'no-repeat',
                }}
            />
            <legend>醫生端</legend>
            <div className={styles.innerContainer}>
                <div
                    onClick={goDashboard}
                    style={{
                        background: `url(${Leave_Icon})`,
                        width: 84,
                        height: 56,
                        right: 24,
                        top: 1,
                        position: 'absolute',
                        backgroundSize: '100%',
                        backgroundRepeat: 'no-repeat',
                    }}
                />
                <div className={styles.info}>
                    <h1>{state.currentUserSerial}</h1>
                    <h1>{state.currentUserName}</h1>
                </div>
                {!isDone && (
                    <div className={styles.info}>
                        <h2>資料確認中....</h2>
                    </div>
                )}
                {isDone && !pairId && (
                    <div className={styles.info}>
                        <h2>初始化連線中....</h2>
                    </div>
                )}
                {pairId && !isAppConnected && (
                    <div className={styles.info}>
                        <div className={styles.pairId}>
                            <h2>配對碼 {pairId}</h2>
                            {pairDeadline && (
                                <div className={styles.time}>
                                    <Countdown
                                        title={
                                            <div>
                                                有效時間
                                                <Popover
                                                    content={simulateAppCotent}
                                                    placement="bottomRight"
                                                    title="更多操作"
                                                    trigger="click"
                                                >
                                                    <SettingOutlined
                                                        width={'2.5em'}
                                                    />
                                                </Popover>
                                            </div>
                                        }
                                        value={pairDeadline}
                                        valueStyle={{
                                            fontSize: '2.5em',
                                        }}
                                        onFinish={onDeadlineExpired}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {isAppConnected && (
                    <div className={styles.info}>
                        <h2>配對成功！</h2>
                        <div
                            className={styles.cst_btn}
                            onClick={() => setOpen(true)}
                        >
                            進入遊戲
                        </div>
                        <div className={styles.cst_btn} onClick={goDashboard}>
                            返回主頁
                        </div>
                    </div>
                )}
            </div>
            <CustomModal
                open={open}
                onClose={() => setOpen(false)}
                overlayColour="rgba(243, 151, 0, 50%)"
            >
                <div className={styles.modal_btn} onClick={goGame1Direct}>
                    圓柱練習
                </div>
                <div className={styles.modal_btn} onClick={goGame2Direct}>
                    多元練習
                </div>
                <div className={styles.modal_btn} onClick={goGame3Direct}>
                    細圓柱練習
                </div>
            </CustomModal>
        </div>
    );
};

export default WaitingRoom;
