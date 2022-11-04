/* eslint-disable no-unreachable */
/* eslint-disable react/display-name */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getDocs,
    updateDoc,
    doc,
    addDoc,
    query,
    where,
} from 'firebase/firestore';
import {
    Layout,
    Form,
    PageHeader,
    Input,
    Button,
    message,
    Modal,
    Row,
    Col,
    Table,
    Space,
    Descriptions,
    InputNumber,
    Popover,
    Checkbox,
    Typography,
} from 'antd';
import {
    PlusOutlined,
    MoreOutlined,
    SearchOutlined,
    CloseCircleFilled,
    ExclamationCircleOutlined,
} from '@ant-design/icons';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';

import { usersRef } from '../../services/firebase';

import Logo from '../../assets/images/page_icon.png';
import Leave_Icon from '../../assets/images/leave_icon.png';
import IconSearch from '../../components/IconSearch';

import { useStore } from '../../store';
import { SET_CUR_USER, SET_CUR_USER_NAME } from '../../store/actions';

const UserList = () => {
    const navigate = useNavigate();
    const { dispatch } = useStore();
    const [users, setUsers] = useState([]); // all user 原始資料
    const [userSearchedResult, setuserSearchedResult] = useState([]);

    const [isDone, setIsDone] = useState(false);

    const [input, setInput] = useState(''); // 輸入框資料

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        const users = await fetchUsers();

        console.log(users);

        setUsers(users);
        setuserSearchedResult(users);
        setIsDone(true);
    };

    const fetchUsers = async () => {
        // 如果需進一步過濾：
        // const q = query(usersRef, where('isDeleted', '!=', true));
        // const querySnapshot = await getDocs(q);

        const users = [];
        const querySnapshot = await getDocs(usersRef);
        querySnapshot.forEach((doc) => {
            users.push({
                ...doc.data(),
                id: doc.id,
            });
        });

        return users;
    };

    const onSearch = () => {
        if (input.length == 0) {
            setuserSearchedResult(users);
            return;
        }

        // '王曉明'.includes('')   結果為 true
        const filteredUsers = users.filter((u) => u?.name?.includes(input));

        setuserSearchedResult(filteredUsers);
    };

    const onDeleteUser = (id) => {
        const theUser = users.find((u) => u.id === id);

        Modal.confirm({
            title: `確定要刪除會員：${theUser.name}`,
            icon: <ExclamationCircleOutlined />,
            content: '刪除後，會員資料將無法返回。',
            okText: '刪除',
            okType: 'danger',
            cancelText: '取消',
            onOk: () => deleteUser(id),
        });
    };

    const deleteUser = async (id) => {
        const theUserRef = doc(usersRef, id);
        await updateDoc(theUserRef, {
            isDeleted: true,
        });

        await fetchUsers();

        message.info('會員已刪除。');
    };

    const goDashboard = () => {
        navigate(ROUTE_PATH.admin_dashbaord);
    };

    const goUserDetail = () => {
        navigate(ROUTE_PATH.user_detail);
    };

    const goEditUser = (id, name) => {
        if (!id || !name) {
            message.error('操作有誤！');
            return;
        }

        dispatch({
            type: SET_CUR_USER,
            payload: id,
        });
        dispatch({
            type: SET_CUR_USER_NAME,
            payload: name,
        });

        navigate(`${ROUTE_PATH.personnel_info}/edit`);
    };

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
                        top: 32,
                        position: 'absolute',
                        backgroundSize: '100%',
                        backgroundRepeat: 'no-repeat',
                    }}
                />
                <div className={styles.cst_btn}>病歷資訊</div>
                <div className={styles.inputGroup}>
                    <input onChange={(e) => setInput(e.target.value)} />
                    <div className={styles.iconWrapper}>
                        <IconSearch onClick={onSearch} />
                    </div>
                </div>
                <div className={styles.horiLine} />
                <caption>近期病例</caption>
                <div className={styles.listWrapper}>
                    {userSearchedResult.map((e, i) => (
                        <section key={e.id}>
                            <span>2022/10/2</span>
                            <span className={styles.name}>
                                {e?.name?.length > 4
                                    ? e?.name.substring(0, 3) + '...'
                                    : e?.name}
                            </span>
                            <span>{e?.serial || '1235'}</span>
                            <span className={styles.situation}>
                                {e?.situation?.length > 5
                                    ? e?.situation.substring(0, 5) + '...'
                                    : e?.situation}
                            </span>
                            <span>復健5次</span>
                            <div
                                className={styles.item_btn}
                                onClick={goUserDetail}
                            >
                                詳情
                            </div>
                            <div
                                className={styles.item_btn}
                                onClick={() => goEditUser(e.id, e.name)}
                            >
                                修改
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserList;
