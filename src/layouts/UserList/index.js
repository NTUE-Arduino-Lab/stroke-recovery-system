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

const { Content } = Layout;
const { Text } = Typography;

const UserList = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]); // 全部使用者資料
    const [filteredUser, setFilteredUser] = useState([]); // 過濾的使用者資料
    const searchBarRef = useRef();
    const [isDone, setIsDone] = useState(false);

    const [currUser, setCurrUser] = useState(); // used by: edit, view
    const [loading, setLoading] = useState(false); // Modal 中的 [OK] 按鈕 loading

    // forms
    const [searchForm] = Form.useForm();
    const [editForm] = Form.useForm();
    const [createForm] = Form.useForm();

    // modals
    const [createModalVisible, setCreateModalVisible] = useState();
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        await fetchUsers();
        setIsDone(true);
    };

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

        setUsers(users);
        setFilteredUser(users);
    };

    const onSearch = async () => {
        const values = await searchForm.validateFields();
        const filteredUser = users.filter((u) => u.name.includes(values.name));

        searchBarRef.current.blur();

        setFilteredUser(filteredUser);
    };

    const onCreateUser = async () => {
        try {
            const values = await createForm.validateFields();

            setLoading(true);
            await addDoc(usersRef, {
                name: values.name,
                idNumber: values.idNumber,
                height: values.height,
                weight: values.weight,
                exerciseHeartRate: values.exerciseHeartRate,
                exerciseResist: values.exerciseResist ?? null,
                exerciseSpeed: values.exerciseSpeed ?? null,
                medicine: values.medicine ?? false,
                note: values.note ?? null,
                isDeleted: false,
            });

            await fetchUsers();
            setLoading(false);
            closeAllModals();
            createForm.resetFields();

            message.success(`成功新增會員！`);
        } catch (e) {
            console.log(e);
            setLoading(false);
            message.error(e?.message);
        }
    };

    const onPatchUser = async () => {
        try {
            const values = await editForm.validateFields();

            setLoading(true);
            const currUserRef = doc(usersRef, currUser.id);
            await updateDoc(currUserRef, {
                height: values.height,
                weight: values.weight,
                exerciseHeartRate: values.exerciseHeartRate,
                exerciseResist: values.exerciseResist ?? null,
                exerciseSpeed: values.exerciseSpeed ?? null,
                medicine: values.medicine ?? false,
                note: values.note ?? null,
            });

            await fetchUsers();
            setLoading(false);
            closeAllModals();

            message.success(`成功更新騎乘者！`);
        } catch (e) {
            console.log(e);
            setLoading(false);
        }
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

    const onViewCurrUserRecord = () => {
        navigate(`${ROUTE_PATH.record_list}/${currUser.id}`);
    };

    const openViewModal = (id) => {
        const currUser = users.find((u) => u.id === id);
        setCurrUser(currUser);
        setViewModalVisible(true);
    };

    const openEditModal = (id) => {
        const currUser = users.find((u) => u.id === id);

        editForm.setFieldsValue({
            idNumber: currUser.idNumber,
            name: currUser.name,
            height: currUser.height,
            weight: currUser.weight,
            exerciseHeartRate: currUser.exerciseHeartRate,
            exerciseResist: currUser.exerciseResist ?? null,
            exerciseSpeed: currUser.exerciseSpeed ?? null,
            medicine: currUser.medicine ?? false,
            note: currUser.note ?? null,
        });

        setCurrUser(currUser);
        setEditModalVisible(true);
    };

    const openCreateModal = () => {
        setCreateModalVisible(true);
    };

    const closeAllModals = () => {
        setViewModalVisible(false);
        setCreateModalVisible(false);
        setEditModalVisible(false);
    };

    const closeViewModal = () => {
        setCurrUser();
        closeAllModals();
    };

    const closeCreateModal = () => {
        createForm.resetFields();
        closeAllModals();
    };

    const closeEditModal = () => {
        setCurrUser();
        closeAllModals();
    };

    const goDashboard = () => {
        navigate(ROUTE_PATH.admin_dashbaord);
    };

    const goTrainingWeekRecord = (targetUserId) => {
        navigate(`${ROUTE_PATH.training_week_record}/${targetUserId}`);
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
                <input />
                <div className={styles.horiLine} />
                <caption>近期病例</caption>
                <div className={styles.listWrapper}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(
                        (e, i) => (
                            <section key={i}>
                                <span>2022/10/2</span>
                                <span>王曉明</span>
                                <span>1235</span>
                                <span>左手中風</span>
                                <span>復健5次</span>
                                <div className={styles.item_btn}>詳情</div>
                                <div className={styles.item_btn}>修改</div>
                            </section>
                        ),
                    )}
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

    return (
        <Layout>
            <Content className="site-layout" style={{ padding: '24px' }}>
                <div className={styles.container}>
                    <PageHeader
                        title="管理會員資訊"
                        subTitle="會員資訊更新、訓練週數紀錄"
                        onBack={goDashboard}
                        extra={[
                            <Button
                                key={1}
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={openCreateModal}
                            >
                                新增會員
                            </Button>,
                        ]}
                    />
                    <Form
                        {...formLayout}
                        form={searchForm}
                        style={{ marginTop: 36 }}
                    >
                        <Row gutter={[16, 0]}>
                            <Col span={16}>
                                <Form.Item label="會員姓名" name="name">
                                    <Input
                                        placeholder="輸入會員姓名查詢"
                                        allowClear={{
                                            clearIcon: (
                                                <CloseCircleFilled
                                                    onClick={onSearch}
                                                    style={{
                                                        color: '#00000040',
                                                    }}
                                                />
                                            ),
                                        }}
                                        ref={searchBarRef}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        onClick={onSearch}
                                        icon={<SearchOutlined />}
                                    >
                                        查詢
                                    </Button>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                    <Table
                        columns={columns(
                            openViewModal,
                            openEditModal,
                            onDeleteUser,
                            goTrainingWeekRecord,
                        )}
                        dataSource={filteredUser}
                        pagination={{ pageSize: 5 }}
                        style={{ marginLeft: 24, marginRight: 24 }}
                    />
                    <Modal
                        title="檢視騎乘者"
                        visible={viewModalVisible}
                        onCancel={closeViewModal}
                        footer={null} // no [Ok], [Cancel] button
                    >
                        <Descriptions
                            bordered
                            className={styles.descriptions}
                            size="middle"
                        >
                            <Descriptions.Item label="會員編號" span={3}>
                                {currUser?.idNumber}
                            </Descriptions.Item>
                            <Descriptions.Item label="姓名" span={3}>
                                {currUser?.name}
                            </Descriptions.Item>
                            <Descriptions.Item label="身高" span={3}>
                                {currUser?.height} 公分
                            </Descriptions.Item>
                            <Descriptions.Item label="體重" span={3}>
                                {currUser?.weight} 公斤
                            </Descriptions.Item>
                            <Descriptions.Item label="運動心率" span={3}>
                                {currUser?.exerciseHeartRate} BPM
                            </Descriptions.Item>
                            <Descriptions.Item label="運動阻力" span={3}>
                                {currUser?.exerciseResist}
                            </Descriptions.Item>
                            <Descriptions.Item label="運動速度" span={3}>
                                {currUser?.exerciseSpeed}
                            </Descriptions.Item>
                            <Descriptions.Item label="是否服用藥物" span={3}>
                                {currUser?.medicine ? '是' : '否'}
                            </Descriptions.Item>
                            <Descriptions.Item label="備註" span={3}>
                                {currUser?.note}
                            </Descriptions.Item>
                        </Descriptions>
                        <Button
                            type="primary"
                            onClick={onViewCurrUserRecord}
                            style={{ marginLeft: '24px' }}
                        >
                            查看 {currUser?.name} 騎乘紀錄
                        </Button>
                    </Modal>
                    {/* 新增 Modal */}
                    <Modal
                        title="新增會員"
                        visible={createModalVisible}
                        onOk={onCreateUser}
                        confirmLoading={loading}
                        onCancel={closeCreateModal}
                        destroyOnClose
                    >
                        <Form
                            {...modalFormLayout}
                            form={createForm}
                            layout="horizontal"
                        >
                            <Form.Item
                                label="會員編號"
                                name="idNumber"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填上會員編號',
                                    },
                                ]}
                            >
                                <Input placeholder="會員編號為身分證字號" />
                            </Form.Item>
                            <Form.Item
                                label="姓名"
                                name="name"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填上姓名',
                                    },
                                ]}
                            >
                                <Input placeholder="" />
                            </Form.Item>
                            <Form.Item
                                label="身高"
                                name="height"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填上會員身高',
                                    },
                                ]}
                            >
                                <InputNumber
                                    min={1}
                                    max={250}
                                    addonAfter={'公分'}
                                />
                            </Form.Item>
                            <Form.Item
                                label="體重"
                                name="weight"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填上會員體重',
                                    },
                                ]}
                            >
                                <InputNumber
                                    min={1}
                                    max={250}
                                    addonAfter={'公斤'}
                                />
                            </Form.Item>
                            <Form.Item
                                label="運動心率"
                                name="exerciseHeartRate"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填上會員運動心率',
                                    },
                                ]}
                            >
                                <InputNumber
                                    min={1}
                                    max={250}
                                    addonAfter={'BPM'}
                                />
                            </Form.Item>
                            <Form.Item
                                label="運動阻力"
                                name="exerciseResist"
                                // rules={[
                                //     {
                                //         required: true,
                                //         message: '請填上姓名',
                                //     },
                                // ]}
                            >
                                <Input placeholder="" />
                            </Form.Item>
                            <Form.Item
                                label="運動速度"
                                name="exerciseSpeed"
                                // rules={[
                                //     {
                                //         required: true,
                                //         message: '請填上姓名',
                                //     },
                                // ]}
                            >
                                <Input placeholder="" />
                            </Form.Item>
                            <Form.Item
                                name="medicine"
                                label="是否服用治療藥物"
                                valuePropName="checked"
                            >
                                <Checkbox>
                                    <Text type="secondary">
                                        （有服用請打勾）
                                    </Text>
                                </Checkbox>
                            </Form.Item>
                            <Form.Item label="備註" name="note">
                                <Input.TextArea
                                    showCount
                                    placeholder="治療藥物註記、其他需留意之處．．．"
                                    maxLength={50}
                                    autoSize={{ minRows: 3, maxRows: 5 }}
                                />
                            </Form.Item>
                        </Form>
                    </Modal>
                    <Modal
                        title="編輯會員"
                        visible={editModalVisible}
                        onOk={onPatchUser}
                        confirmLoading={loading}
                        onCancel={closeEditModal}
                        destroyOnClose
                    >
                        <Form
                            {...modalFormLayout}
                            form={editForm}
                            layout="horizontal"
                        >
                            <Form.Item label="會員編號">
                                {currUser?.idNumber}
                            </Form.Item>
                            <Form.Item label="姓名">{currUser?.name}</Form.Item>
                            <Form.Item
                                label="身高"
                                name="height"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填上會員身高',
                                    },
                                ]}
                            >
                                <InputNumber
                                    min={1}
                                    max={250}
                                    addonAfter={'公分'}
                                />
                            </Form.Item>
                            <Form.Item
                                label="體重"
                                name="weight"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填上會員體重',
                                    },
                                ]}
                            >
                                <InputNumber
                                    min={1}
                                    max={250}
                                    addonAfter={'公斤'}
                                />
                            </Form.Item>
                            <Form.Item
                                label="運動心率"
                                name="exerciseHeartRate"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填上會員運動心率',
                                    },
                                ]}
                            >
                                <InputNumber
                                    min={1}
                                    max={250}
                                    addonAfter={'BPM'}
                                />
                            </Form.Item>
                            <Form.Item
                                label="運動阻力"
                                name="exerciseResist"
                                // rules={[
                                //     {
                                //         required: true,
                                //         message: '請填上姓名',
                                //     },
                                // ]}
                            >
                                <Input placeholder="" />
                            </Form.Item>
                            <Form.Item
                                label="運動速度"
                                name="exerciseSpeed"
                                // rules={[
                                //     {
                                //         required: true,
                                //         message: '請填上姓名',
                                //     },
                                // ]}
                            >
                                <Input placeholder="" />
                            </Form.Item>
                            <Form.Item
                                name="medicine"
                                label="是否服用治療藥物"
                                valuePropName="checked"
                            >
                                <Checkbox>
                                    <Text type="secondary">
                                        （有服用請打勾）
                                    </Text>
                                </Checkbox>
                            </Form.Item>
                            <Form.Item label="備註" name="note">
                                <Input.TextArea
                                    showCount
                                    placeholder="治療藥物註記、其他需留意之處．．．"
                                    maxLength={50}
                                    autoSize={{ minRows: 3, maxRows: 5 }}
                                />
                            </Form.Item>
                        </Form>
                    </Modal>
                </div>
            </Content>
        </Layout>
    );
};

const columns = (
    openViewModal,
    openEditModal,
    onDeleteUser,
    goTrainingWeekRecord,
) => [
    {
        key: 'idNumber',
        title: '會員編號',
        dataIndex: 'idNumber',
        // sorter: {
        //     compare: (a, b) => a.age - b.age,
        // },
        width: 200,
        render: (idNumber) => idNumber.slice(0, 4) + '...',
    },
    {
        key: 'name',
        title: '會員姓名',
        dataIndex: 'name',
        width: 200,
    },
    {
        key: 'medicine',
        title: '是否服用治療藥物',
        dataIndex: 'medicine',
        render: (isMedicine) => (isMedicine ? '是' : '否'),
        width: 150,
        align: 'center',
    },
    {
        key: 'note',
        title: '備註',
        dataIndex: 'note',
    },
    {
        key: 'id',
        title: '',
        dataIndex: 'id',
        align: 'center',
        render: (id) => {
            return (
                <Button type="link" onClick={() => goTrainingWeekRecord(id)}>
                    前往訓練週數紀錄
                </Button>
            );
        },
        width: 150,
    },
    {
        key: 'id',
        title: '',
        dataIndex: 'id',
        align: 'center',
        render: (id) => {
            return (
                <Popover
                    content={
                        <Space direction="vertical" size="small">
                            <Button
                                type="link"
                                onClick={() => openViewModal(id)}
                            >
                                查看會員資訊
                            </Button>
                            <Button
                                type="link"
                                onClick={() => openEditModal(id)}
                            >
                                編輯會員資訊
                            </Button>
                            <Button
                                type="link"
                                danger
                                onClick={() => onDeleteUser(id)}
                            >
                                刪除會員
                            </Button>
                        </Space>
                    }
                    trigger="click"
                    placement="left"
                >
                    <MoreOutlined rotate={90} style={{ fontSize: '20px' }} />
                </Popover>
            );
        },
        width: 150,
    },
];

const formLayout = {
    labelCol: {
        // span: 8,
        offset: 10,
    },
    wrapperCol: {
        span: 16,
    },
};

const modalFormLayout = {
    labelCol: {
        span: 8,
        // offset:,
    },
    wrapperCol: {
        span: 16,
    },
};

export default UserList;
