import { InfoCard, InfoCardProps, InstallStaus } from '@/components/card/InfoCard';
import { invoke } from '@tauri-apps/api/core';
import { useState, useEffect } from 'react';

export default function MyServersPage() {
    const [dingDingInfo, setDingDingInfo] = useState<InfoCardProps>(
        {
            id: '1',
            title: '钉钉文档获取',
            description: '用于本地获取钉钉文档内容的mcp服务',
            creator: 'dongfb',
            logoUrl: 'https://dingding.com/logo.png',
            tags: ['钉钉', 'mcp'],
            env: {},
            guide: '',
            installStaus: 'uninstall',
            isStart: false,
            isChecking: false
        }
    )

    const checkDingDingDependencies = async () => {
        setDingDingInfo(prev => ({
            ...prev,
            isChecking: true
        }));
        try {
            const status = await invoke<InstallStaus>("check_dingding_dependency");
            console.log(status)
            if (['installing', 'update', 'latestVersion'].includes(status)) {
                checkDingDingIsStart()
            }
            setDingDingInfo(prev => ({
                ...prev,
                installStaus: status
            }));
        } finally {
            setDingDingInfo(prev => ({
                ...prev,
                isChecking: false
            }));
        }
    };

    const checkDingDingIsStart = async () => {
        try {
            const status = await invoke<boolean>("check_dingding_is_start");
            console.log(status)
            setDingDingInfo(prev => ({
                ...prev,
                isStart: status
            }));
            console.log('checkDingDingIsStart', status)
        } finally {
        }
    };

    const dingDingInstall = async () => {
        setDingDingInfo(prev => ({
            ...prev,
            isChecking: true
        }));
        try {
            try {
                await invoke<InstallStaus>("check_dingding_install");
            } catch (error) {
                console.log(error)
            }
            const status = await invoke<InstallStaus>("check_dingding_dependency");
            console.log(status)
            setDingDingInfo(prev => ({
                ...prev,
                installStaus: status
            }));
        } finally {
            setDingDingInfo(prev => ({
                ...prev,
                isChecking: false
            }));
        }
    };

    const dingDingStart = async () => {
        try {
            await invoke<InstallStaus>("check_dingding_start");
        } catch (error) {
            console.log(error)
        }
        checkDingDingIsStart()
    }
    const dingDingStop = async () => {
        try {
            await invoke<InstallStaus>("check_dingding_stop");
        } catch (error) {
            console.log(error)
        }
        checkDingDingIsStart()
    }


    useEffect(() => {
        checkDingDingDependencies();
    }, []);

    return (
        <div className="container mx-auto p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <InfoCard
                    {...dingDingInfo}
                    installClick={() => dingDingInstall()}
                    startClick={() => dingDingStart()}
                    stopClick={() => dingDingStop()}
                />
            </div>
        </div>
    )
}
