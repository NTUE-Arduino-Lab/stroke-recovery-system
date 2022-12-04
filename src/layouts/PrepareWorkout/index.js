/* eslint-disable no-debugger */
/* eslint-disable no-unreachable */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDocs, query, where } from 'firebase/firestore';
import { Empty } from 'antd';
import _ from '../../util/helper';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';

import Leave_Icon from '../../assets/images/leave_icon.png';
import Logo from '../../assets/images/page_icon.png';
import CustomModal from '../../components/CustomModal';

import { usersRef } from '../../services/firebase';
import { useStore } from '../../store';
import {
    SET_CUR_USER,
    SET_CUR_USER_NAME,
    SET_CUR_USER_SERIAL,
} from '../../store/actions';
import wait from '../../util/wait';
import IconSearch from '../../components/IconSearch';

const PrepareWorkout = () => {
    const navigate = useNavigate();
    const { dispatch } = useStore();
    const params = useParams();

    const [users, setUsers] = useState(); // all user 原始資料
    const [userSearchedResult, setuserSearchedResult] = useState([]);
    const [selectedUser, setSelectedUser] = useState();

    const [isDone, setIsDone] = useState(false);
    const [hasSearched, setHasSearched] = useState(false); // 有搜尋過了

    const [input, setInput] = useState(''); // 輸入框資料

    //
    /// 針對中風復健新增的內容
    ////
    /////
    const [open, setOpen] = useState(false); // 選擇關卡的 modal

    // useEffect(() => {
    //     if (params?.action == 'open-modal') {
    //         setOpen(true);
    //     }
    // }, [params]);

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        const users = await fetchUsers();

        console.log(users);

        setUsers(users);
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

    const goDashboard = async () => {
        navigate(ROUTE_PATH.admin_dashbaord);
    };

    const goWaitingRoom = async () => {
        if (!selectedUser) {
            return;
        }

        const theUser = users.find((u) => u.id == selectedUser);
        dispatch({
            type: SET_CUR_USER_NAME,
            payload: theUser?.name,
        });
        dispatch({
            type: SET_CUR_USER_SERIAL,
            payload: theUser?.idNumber.slice(0, 4),
        });
        dispatch({
            type: SET_CUR_USER,
            payload: selectedUser,
        });

        navigate(ROUTE_PATH.waiting_room);
    };

    const onSearch = () => {
        if (input.length == 0) {
            setuserSearchedResult([]);
            setSelectedUser();
            setHasSearched(true);
            return;
        }

        // '王曉明'.includes('')   結果為 true
        const filteredUsers = users.filter((u) => u?.name?.includes(input));

        setuserSearchedResult(filteredUsers);
        setSelectedUser();
        setHasSearched(true);
    };

    const onSelectUser = (id) => {
        setSelectedUser(id);
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
                        top: 1,
                        position: 'absolute',
                        backgroundSize: '100%',
                        backgroundRepeat: 'no-repeat',
                    }}
                />
                <div className={styles.item_btn}>
                    <span>連</span>
                    <span>線</span>
                    <span>復</span>
                    <span>健</span>
                    <span>人</span>
                </div>
                <div className={styles.inputGroup}>
                    <input onChange={(e) => setInput(e.target.value)} />
                    <div className={styles.iconWrapper}>
                        <IconSearch onClick={onSearch} />
                    </div>
                </div>
                {hasSearched &&
                    (userSearchedResult.length > 0 ? (
                        <div className={styles.listWrapper}>
                            {userSearchedResult.map((e, i) => (
                                <section
                                    key={i}
                                    className={
                                        selectedUser === e.id
                                            ? styles.active
                                            : null
                                    }
                                >
                                    {/* <span>{e?.serial || '1235'}</span> */}
                                    <span className={styles.name}>
                                        {e?.name?.length > 4
                                            ? e?.name.substring(0, 3) + '...'
                                            : e?.name}
                                    </span>
                                    <span>{e?.idNumber}</span>
                                    <span className={styles.situation}>
                                        {e?.situation?.length > 5
                                            ? e?.situation.substring(0, 5) +
                                              '...'
                                            : e?.situation}
                                    </span>
                                    <div
                                        className={`${styles.action} ${
                                            selectedUser === e.id
                                                ? styles.active
                                                : null
                                        }`}
                                        onClick={() => onSelectUser(e.id)}
                                    >
                                        選擇
                                    </div>
                                </section>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.noData}>
                            <Empty />
                        </div>
                    ))}

                <div
                    className={styles.cst_btn}
                    onClick={goWaitingRoom}
                    style={{
                        background: selectedUser ? '#3D4EAE' : '#D9D9D9',
                    }}
                >
                    進行連線
                </div>
                <div className={styles.cst_btn} onClick={goDashboard}>
                    返回主頁
                </div>
            </div>
            <CustomModal
                open={open}
                onClose={() => setOpen(false)}
                overlayColour="rgba(243, 151, 0, 50%)"
            >
                <div className={styles.modal_btn} onClick={goDashboard}>
                    圓柱練習
                </div>
                <div className={styles.modal_btn} onClick={goDashboard}>
                    多元練習
                </div>
                <div className={styles.modal_btn} onClick={goDashboard}>
                    細圓柱練習
                </div>
            </CustomModal>
        </div>
    );
};

export default PrepareWorkout;
