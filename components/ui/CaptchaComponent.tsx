'use client';

import { useRef, useCallback } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

interface CaptchaProps {
    onVerify: (token: string) => void;
    onError?: (error: Error | unknown) => void;
    onExpire?: () => void;
    disabled?: boolean;
}

export default function CaptchaComponent({ onVerify, onError, onExpire, disabled }: CaptchaProps) {
    const captchaRef = useRef<HCaptcha>(null);

    const handleVerify = useCallback((token: string) => {
        console.log('Captcha verified:', token);
        onVerify(token);
    }, [onVerify]);

    const handleError = useCallback((error: Error | unknown) => {
        console.error('Captcha error:', error);
        if (onError) {
            onError(error);
        }
    }, [onError]);

    const handleExpire = useCallback(() => {
        console.log('Captcha expired');
        if (onExpire) {
            onExpire();
        }
    }, [onExpire]);

    const resetCaptcha = useCallback(() => {
        if (captchaRef.current) {
            captchaRef.current.resetCaptcha();
        }
    }, []);

    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="flex justify-center">
                <HCaptcha
                    ref={captchaRef}
                    sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
                    onVerify={handleVerify}
                    onError={handleError}
                    onExpire={handleExpire}
                    theme="light"
                    size="normal"
                />
            </div>

            {disabled && (
                <div className="text-sm text-gray-500 text-center">
                    Please complete the captcha verification above
                </div>
            )}

            <button
                type="button"
                onClick={resetCaptcha}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
                Reset Captcha
            </button>
        </div>
    );
}
