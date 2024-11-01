'use client';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
// import { parseEmail } from '@dimidumo/zk-email-sdk-ts';

export default function SearchBar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  //   const tryParse = async () => {
  //     try {
  //       console.log('try parse');
  //       const parsed = await parseEmail(`Delivered-To: dimi.zktest@gmail.com
  // Received: by 2002:ab3:748b:0:b0:281:7c8c:2153 with SMTP id r11csp287235lte;
  //         Fri, 1 Nov 2024 02:57:01 -0700 (PDT)
  // X-Received: by 2002:a05:6122:893:b0:50d:2317:5b61 with SMTP id 71dfb90a1353d-5106b15d8edmr7480836e0c.6.1730455021086;
  //         Fri, 01 Nov 2024 02:57:01 -0700 (PDT)
  // ARC-Seal: i=1; a=rsa-sha256; t=1730455021; cv=none;
  //         d=google.com; s=arc-20240605;
  //         b=TOmWagtbbwVTckqCZhK+XaCE3yRVqHSe9A5VwrW57x3WCPbqzl/Zg0fOzusUh21v77
  //           nDImKJCYkoYytE6BrghatY2avVFhspSEt/M2RAcDBZjtSFGMMSH4PCRbKDrH35S/qO/P
  //           bZDs/MC6oTJXiybFKC855m31XuCegihrxxcr/ThIOurP/OMwkYutrsuMs4Gb5b/J5u+n
  //           X29gEteBmuMgSGUEJ+HuJzO5vewHxRc34WS0D6kom0IIwdJeqduiqKln3Luq3Wn/EH3q
  //           I5InuoO8ySJnzmyWaGOS7QVGGTWXpKp+NsRGB1K69LpBflJfzCq21lmSNUyRKJgQafUw
  //           rypg==
  // ARC-Message-Signature: i=1; a=rsa-sha256; c=relaxed/relaxed; d=google.com; s=arc-20240605;
  //         h=to:subject:message-id:date:from:mime-version:dkim-signature;
  //         bh=veF/HJxwzYXUCx450B41EN+37m+TvaC3G7QJJ60OIrQ=;
  //         fh=g+VKR6KapcPYeSC2EJb+P1CLrGqn6PwuMnx1WRnzY0s=;
  //         b=alC59oI745jr6gl3+Hr4NAdCPBiSdmmTWy9asGz1A96t6ANZQz77/H/HpZfW4oalYw
  //           aNZWdygmMQZ/hOXVBxSG5IZkesA87k5EXHDY1d5IAS3O5g9m/I7bAz2l+FPkdVGYIX/d
  //           +guL0CX1bEuFL3puKeqPtXDmNobmHMJ2PJie6JaJkHiiS/FIDxTr0QYhcKQFbhoZWJQq
  //           VljAbYlQX4vnGB/eoBQsUg8ppLpeiht2OrfIp8xobyPN9UYg6VKc2IPbz7fUD9VgvX0V
  //           d3xUL9NfSMZm35FQFGqHGW7WVLcWV3W1D56n+hdpa6mMLxFOLn1SEyD1f82jpK1ONoOD
  //           Nn0w==;
  //         dara=google.com
  // ARC-Authentication-Results: i=1; mx.google.com;
  //         dkim=pass header.i=@googlemail.com header.s=20230601 header.b=G6LrQ3Mc;
  //         spf=pass (google.com: domain of dimitridumonet@googlemail.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=dimitridumonet@googlemail.com;
  //         dmarc=pass (p=QUARANTINE sp=QUARANTINE dis=NONE) header.from=googlemail.com;
  //         dara=pass header.i=@gmail.com
  // Return-Path: <dimitridumonet@googlemail.com>
  // Received: from mail-sor-f41.google.com (mail-sor-f41.google.com. [209.85.220.41])
  //         by mx.google.com with SMTPS id 71dfb90a1353d-5106f2d6473sor745918e0c.3.2024.11.01.02.57.00
  //         for <dimi.zktest@gmail.com>
  //         (Google Transport Security);
  //         Fri, 01 Nov 2024 02:57:01 -0700 (PDT)
  // Received-SPF: pass (google.com: domain of dimitridumonet@googlemail.com designates 209.85.220.41 as permitted sender) client-ip=209.85.220.41;
  // Authentication-Results: mx.google.com;
  //         dkim=pass header.i=@googlemail.com header.s=20230601 header.b=G6LrQ3Mc;
  //         spf=pass (google.com: domain of dimitridumonet@googlemail.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=dimitridumonet@googlemail.com;
  //         dmarc=pass (p=QUARANTINE sp=QUARANTINE dis=NONE) header.from=googlemail.com;
  //         dara=pass header.i=@gmail.com
  // DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
  //         d=googlemail.com; s=20230601; t=1730455020; x=1731059820; dara=google.com;
  //         h=to:subject:message-id:date:from:mime-version:from:to:cc:subject
  //           :date:message-id:reply-to;
  //         bh=veF/HJxwzYXUCx450B41EN+37m+TvaC3G7QJJ60OIrQ=;
  //         b=G6LrQ3McR+WrpjBoVyxw6blA0WBykIGNPx16VCOmZ0C13CG60FcfzP962waEu+2Exo
  //           esCJ+jWRbD074l/DW0KZML0xvXhXbnw0CfpcTl8SNbP3d3jamglQtNJWPlrIW5qYyjrs
  //           3k/4h1BxUeOuZC7njgC5pq5DnXK4yxph/fSmyfHye9kMzIF67DJeWLUUo1xI7lLiEeXQ
  //           oIooVVrESrkEfKx3BYylU5Smjwrjz07s18cvfwDQnSosjIIRZT4XjjIVo8+d0QLhb1hb
  //           9pWsnoAeC8LL+/SruoPc7Y4oSnC/3yQbVE5Su/7uUxaipln7tADNZrkdRvE42azpSitZ
  //           Tw1Q==
  // X-Google-DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
  //         d=1e100.net; s=20230601; t=1730455020; x=1731059820;
  //         h=to:subject:message-id:date:from:mime-version:x-gm-message-state
  //           :from:to:cc:subject:date:message-id:reply-to;
  //         bh=veF/HJxwzYXUCx450B41EN+37m+TvaC3G7QJJ60OIrQ=;
  //         b=Qg0krIJ6xZhj1APVuJ6n5IpVIXIVNZlnmvYHFsEgMCSuupoRDiQdjKwSvjlRLC/0dH
  //           GLRgvZKZle034BYHd/RrUrwaBH5Mqd9SgRKGco2FWxhj9qsBEdut7H6ewS4pPX9JSsEH
  //           guTC1+fUxf/Nesu/GJj7FteYJOznezmwC0N9ncvoGUmbw2CVBYBPULZt9UzW1GBA451E
  //           qYM2Qg2agPgLrwo0ZAyc0pOQHeR7EVK+UgiUIEE5d9lQtV2uxMFAXbQyvHPD7Z+XE2yZ
  //           9tFexGlnje6/A1QTUKT4Ft+50SnXRm+ZnawTjxzeDB0FZUQQ37aYUJI2U8/4zIKuktgx
  //           QKpA==
  // X-Gm-Message-State: AOJu0YxbcmTf9eTJtT30bxJ8Z2GgbPnRHV6kf1s2Kgrc65/9up7ig7We vABzGjkjREm17NOp/t97hU65Lz1TVqKoBAq7NtugFDsbWYGS9C6WgS5+0E9qfn5BVofJEXy6Tz5 vp2jdyHDdKZHTyBFowxofDXLwsRYgI+uq
  // X-Google-Smtp-Source: AGHT+IE+42y/0GKfvrhr4vNYTNga2bVp66RTLPKMLOJe1SCjQdvpnL/HRA92uz15kirf3qUkJDr82zM4HKymvKi/lSI=
  // X-Received: by 2002:a05:6122:893:b0:50d:2317:5b61 with SMTP id 71dfb90a1353d-5106b15d8edmr7480817e0c.6.1730455020577; Fri, 01 Nov 2024 02:57:00 -0700 (PDT)
  // MIME-Version: 1.0
  // From: Dimitri Dumonet <dimitridumonet@googlemail.com>
  // Date: Fri, 1 Nov 2024 16:56:49 +0700
  // Message-ID: <CAGqchYGA=MF4W8ByOZAseFnv5xhcmT+jqS4SjaatWRN8Kjbc6Q@mail.gmail.com>
  // Subject: ma test
  // To: dimi.zktest@gmail.com
  // Content-Type: multipart/alternative; boundary="000000000000cd2dfe0625d6f42f"

  // --000000000000cd2dfe0625d6f42f
  // Content-Type: text/plain; charset="UTF-8"

  // Hi!

  // --000000000000cd2dfe0625d6f42f
  // Content-Type: text/html; charset="UTF-8"

  // <div dir="ltr">Hi!</div>

  // --000000000000cd2dfe0625d6f42f--`);
  //       console.log('parsed: ', parsed);
  //     } catch (err) {
  //       console.log('err parsing email: ', err);
  //     }
  //   };
  //   tryParse();

  const handleSearch = useDebouncedCallback((term) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('search', term);
    } else {
      params.delete('search');
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        placeholder="Search blueprints.."
        className="w-full rounded-lg border px-4 py-2 pl-10"
        onChange={(e) => {
          handleSearch(e.target.value);
        }}
        defaultValue={searchParams.get('search')?.toString()}
      />
      <svg
        className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-grey-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  );
}
