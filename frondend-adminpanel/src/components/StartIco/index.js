import { useEffect, useState } from "react";
import { Row } from "react-bootstrap"
import {
    Button,
    Form,
    Space,
    InputNumber,
    Select
} from "antd";

import "./index.scss"

const { Option } = Select;

const StartIco = (props) => {
    const {
        handleStartIco
    } = props

    const [form] = Form.useForm();

    const onSubmit = async () => {
        await handleStartIco()
    };

    useEffect(() => {
    }, [])

    return (
        <div>
            <h5><strong>Start ICO(only owner)</strong></h5>
            <Button type="primary" onClick={onSubmit}>
                Start ICO
            </Button>
        </div>
    )
}

export default StartIco;