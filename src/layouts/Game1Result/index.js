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

import { ROUTE_PATH, VALID_MIN, WARN_THRESHOLD, WARN } from '../../constants';
import styles from './styles.module.scss';

import Logo_Icon from '../../components/IconLogo';
import ShapeCircle from '../../components/ShapeCircle';

import {
    usersRef,
    difficultiesRef,
    recordsRef,
    generateValidPairId,
    validateInputPairId,
} from '../../services/firebase';
import wait from '../../util/wait';

const { Countdown } = Statistic;
const { Content } = Layout;
const { Option } = Select;
const { Text } = Typography;

const initialPacket = {
    rpm: 0,
    time: 0,
    heartRate: 0,
};

let unsubscribe = null;

const Game1Result = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const [users, setUsers] = useState();
    const [difficulties, setDifficulties] = useState([]);
    const [isDone, setIsDone] = useState(false);

    // store [id]
    const [selectedUser, setSelectedUser] = useState();
    const [selectedDiff, setSelectedDiff] = useState();

    // 提供查看[使用者], [關卡]所需資訊。store data object
    const [selectedUserData, setSelectedUserData] = useState();
    const [selectedDiffData, setSelectedDiffData] = useState();
    const [userModalVis, setUserModalVis] = useState(false);
    const [diffModalVis, setDiffModalVis] = useState(false);

    //
    // 顯示”當前關卡“各階段警示心率的值
    const [warnHRValues, setWarnHRValues] = useState([]);
    //
    //

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

    useEffect(() => {
        init();

        return () => {
            if (_.isFunction(unsubscribe)) unsubscribe();
        };
    }, []);

    const init = async () => {
        const users = await fetchUsers();
        const difficulties = await fetchDiffs();

        setUsers(users);
        setDifficulties(difficulties);
        setIsDone(true);
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
                    message.success('配對成功，您可以前往監視畫面了！');
                }
            }
        });

        // going to listen doc change!
    }, [targetgetRecordId]);

    const fetchUsers = async () => {
        const q = query(usersRef, where('isDeleted', '!=', true));

        const users = [];
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            users.push({
                ...doc.data(),
                id: doc.id,
            });
        });

        return users;
    };

    const fetchDiffs = async () => {
        const q = query(difficultiesRef, where('isDeleted', '!=', true));

        const difficulties = [];
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            difficulties.push({
                ...doc.data(),
                id: doc.id,
            });
        });

        return difficulties;
    };

    const goDashboard = async () => {
        if (targetgetRecordId) {
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

    const goGameMoni = () => {
        navigate(ROUTE_PATH.game1_monitoring);
    };

    const goNextGameDir = () => {
        navigate(ROUTE_PATH.game2_direct);
    };

    const goMonitoring = () => {
        navigate(`${ROUTE_PATH.monitoring_workout}/${targetgetRecordId}`, {
            replace: true,
        });
    };

    const confirmUserAndDiff = async () => {
        // const valid = await form.validateFields();

        // console.log(valid);

        if (selectedUser == null || selectedDiff == null) {
            Modal.error({
                title: '有內容沒有完成...',
                content: '請填寫好騎乘者資訊以及關卡資訊',
            });
            return;
        }

        Modal.confirm({
            title: '即將產生配對碼！',
            icon: <ExclamationCircleOutlined />,
            content: '資料一旦輸入將無法進行修改，請確認無誤！',
            onOk: () => createRecord(),
        });
    };

    const createRecord = async () => {
        if (selectedUser == null || selectedDiff == null) {
            return;
        }

        const theDiff = difficulties.find((d) => d.id === selectedDiff);

        const targetHeartRate = theDiff.targetHeartRate; // careful the type
        const upperLimitHeartRate = theDiff.upperLimitHeartRate; // careful the type
        // constant
        const user = selectedUser;
        const difficulty = selectedDiff;
        const pairId = await generateValidPairId();
        const isAppConnected = false;
        const createdTime = Timestamp.now();
        const beginWorkoutTime = null;
        const finishedWorkoutTime = null;

        const targetRecordRef = await addDoc(recordsRef, {
            targetHeartRate,
            upperLimitHeartRate,
            pairId,
            isAppConnected,
            user,
            createdTime,
            beginWorkoutTime,
            finishedWorkoutTime,
            difficulty,
        });
        console.log('Document written with ID: ', targetRecordRef.id);

        // initialize sub collection - packets
        await addDoc(
            collection(recordsRef, targetRecordRef.id, 'packets'),
            initialPacket,
        );

        setTargetRecordId(targetRecordRef.id);
        setPairId(pairId);

        // start a count-down
        const deadline = Date.now() + 1000 * 60 * VALID_MIN;
        setPairDeadline(deadline);

        message.info({ content: '配對碼已生成！請在時間內進行配對！' }, 5);

        // targetHeartRate
        // upperLimitHeartRate
        // pairId
        // isAppConnected
        // user
        // beginWorkoutTime
        // finishedWorkoutTime
        // createdTime
        // difficulty
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
        message.warn('連結過期，請重新選擇！', 3);

        await wait(1000);
        await deleteRecord();
        setTargetRecordId(null);
        setPairId(null);
        setSelectedUser();
        setSelectedDiff();
        setPairDeadline(null);
        setInputPairId(null);
        form.resetFields();
    };

    const onUserChange = (value) => setSelectedUser(value);
    const onDiffChange = (value) => setSelectedDiff(value);

    const openUserModal = () => {
        const selectedUserData = users.find((u) => u.id === selectedUser);

        setUserModalVis(true);
        setSelectedUserData(selectedUserData);
    };
    const openDiffModal = () => {
        const selectedDiffData = difficulties.find(
            (d) => d.id === selectedDiff,
        );
        const warnHRValues = getExactThresholdValue(
            selectedDiffData.upperLimitHeartRate,
        );

        setDiffModalVis(true);
        setSelectedDiffData(selectedDiffData);
        setWarnHRValues(warnHRValues);
    };
    const closeUserModal = () => {
        setUserModalVis(false);
        setSelectedUserData();
    };
    const closeDiffModal = () => {
        setDiffModalVis(false);
        setSelectedDiffData();
    };

    const getExactThresholdValue = (upperLimitHeartRate) => {
        if (!_.isNumber(upperLimitHeartRate)) {
            return;
        }

        const calBase = upperLimitHeartRate / 100;

        const overHigh = Math.ceil(calBase * WARN_THRESHOLD.High);
        const overMedium = Math.ceil(calBase * WARN_THRESHOLD.Medium);
        const overSlight = Math.ceil(calBase * WARN_THRESHOLD.Slight);

        return [overSlight, overMedium, overHigh];
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
            {/* <Button onClick={pairWithApp} disabled={isAppConnected}>
                我要配對
            </Button> */}
        </div>
    );

    ///
    const onSubmit = (e) => {
        e.preventDefault();

        console.log(e);
    };

    return (
        <div className={styles.container}>
            <legend>醫生端</legend>
            <div className={styles.leftContainer}>
                <div className={`${styles.infoBlock} ${styles.time}`}>
                    <h2>10:59</h2>
                    <h3>花費時間</h3>
                </div>
                <div className={`${styles.infoBlock} ${styles.score}`}>
                    <div>
                        <h1>10</h1>
                        <h3>得分</h3>
                    </div>
                </div>
                <div className={`${styles.infoBlock} ${styles.detail}`}>
                    <div className={styles.singleInfoWrapper}>
                        <div className={styles.shapeWrapper}>
                            <ShapeCircle
                                fill="#FD6B6B"
                                width="100%"
                                height="100%"
                            />
                            <h4>3</h4>
                        </div>
                    </div>
                    <div className={styles.singleInfoWrapper}>
                        <div className={styles.shapeWrapper}>
                            <ShapeCircle
                                fill="#6CB3F3"
                                width="100%"
                                height="100%"
                            />
                            <h4>3</h4>
                        </div>
                    </div>
                    <div className={styles.singleInfoWrapper}>
                        <div className={styles.shapeWrapper}>
                            <ShapeCircle
                                fill="#F6D735"
                                width="100%"
                                height="100%"
                            />
                            <h4>1</h4>
                        </div>
                    </div>
                    <div
                        className={`${styles.singleInfoWrapper} ${styles.error}`}
                    >
                        <div className={styles.shapeWrapper}>
                            <ShapeCircle
                                fill="rgba(0,0,0, .76)"
                                width="100%"
                                height="100%"
                            />
                            <h4>1</h4>
                        </div>
                        <h3>錯誤</h3>
                    </div>
                </div>
            </div>
            <div className={styles.rightContainer}>
                <div className={styles.logo}>
                    <Logo_Icon onClick={goDashboard} />
                </div>
                <div className={styles.action} onClick={goGameMoni}>
                    重新開始
                </div>
                <div className={styles.action} onClick={goNextGameDir}>
                    下一關卡
                </div>
                <div className={styles.action} onClick={goGameMoni}>
                    過往紀錄
                </div>
            </div>
        </div>
    );

    if (!isDone) {
        return (
            <Layout style={{ padding: '24px' }}>
                <div className={styles.container}>
                    <PageHeader
                        className={styles.PageHeader}
                        title="資料讀取中..."
                    />
                </div>
            </Layout>
        );
    }
};

const WarnHRValueDisplay = (value, warn) => {
    let phase;
    let overVal;
    if (warn === WARN.Slight) {
        phase = '一';
        overVal = WARN_THRESHOLD.Slight - 100;
    }
    if (warn === WARN.Medium) {
        phase = '二';
        overVal = WARN_THRESHOLD.Medium - 100;
    }
    if (warn === WARN.High) {
        phase = '三';
        overVal = WARN_THRESHOLD.High - 100;
    }

    return (
        <div style={{ display: 'flex' }}>
            第{phase}階段：{value}
            <Text type="secondary" style={{ fontSize: '0.85em' }}>
                （超出 {overVal}％）
            </Text>
        </div>
    );
};

const formLayout = {
    labelCol: {
        span: 8,
    },
    wrapperCol: {
        span: 10,
    },
};

const tailLayout = {
    wrapperCol: {
        offset: 8,
        span: 16,
    },
};

export default Game1Result;
