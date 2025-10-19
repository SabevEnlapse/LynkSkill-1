// `hooks/use-is-in-view.ts` (or the hook file you provided)
    import * as React from "react";
    import { useInView, type UseInViewOptions } from "motion/react";

    export interface UseIsInViewOptions {
        inView?: boolean;
        inViewOnce?: boolean;
        inViewMargin?: UseInViewOptions["margin"];
    }

    export function useIsInView<T extends HTMLElement = HTMLElement>(
        externalRef?: React.Ref<T>,
        options: UseIsInViewOptions = {},
    ) {
        const { inView = true, inViewOnce = false, inViewMargin = "0px" } = options;

        const localRef = React.useRef<T | null>(null);

        // callback ref that updates localRef and forwards to externalRef (if provided)
        const callbackRef = React.useCallback(
            (node: T | null) => {
                localRef.current = node;

                if (!externalRef) return;

                if (typeof externalRef === "function") {
                    try {
                        (externalRef as (instance: T | null) => void)(node);
                    } catch {
                        // noop
                    }
                } else {
                    try {
                        (externalRef as React.MutableRefObject<T | null>).current = node;
                    } catch {
                        // noop
                    }
                }
            },
            [externalRef],
        );

        const inViewResult = useInView(localRef, {
            once: inViewOnce,
            margin: inViewMargin,
        });

        const isInView = !inView || inViewResult;

        // return the callback as React.Ref<T> so it can be passed directly to motion/mDOM components
        return { ref: callbackRef as React.Ref<T>, isInView };
    }