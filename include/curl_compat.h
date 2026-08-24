#pragma once

#ifndef DUSTPLAY_WIN32

#include <curl/curl.h>

#else

#include <cstdint>
#include <cstddef>
#include <cstring>
#include <cstdlib>


typedef void CURL;
typedef int CURLcode;
typedef int CURLoption;
typedef int CURLINFO;
typedef int64_t curl_off_t;

#define CURL_GLOBAL_DEFAULT 0
#define CURLE_OK 0
#define CURLOPT_URL 10002
#define CURLOPT_POSTFIELDS 10015
#define CURLOPT_WRITEFUNCTION 20011
#define CURLOPT_WRITEDATA 10001
#define CURLOPT_TIMEOUT 13
#define CURLOPT_CUSTOMREQUEST 10036
#define CURLOPT_HTTPHEADER 10023
#define CURLOPT_HEADERFUNCTION 20079
#define CURLOPT_HEADERDATA 10029
#define CURLOPT_UPLOAD 46
#define CURLOPT_READDATA 10009
#define CURLOPT_INFILESIZE_LARGE 30115
#define CURLOPT_XFERINFOFUNCTION 20219
#define CURLOPT_XFERINFODATA 10219
#define CURLOPT_NOPROGRESS 43
#define CURLOPT_FOLLOWLOCATION 52
#define CURLINFO_RESPONSE_CODE 0x200002


struct curl_slist {
    char* data;
    struct curl_slist* next;
};

inline CURLcode curl_global_init(long) { return CURLE_OK; }
inline void curl_global_cleanup() {}
inline CURL* curl_easy_init() { return nullptr; }
inline void curl_easy_cleanup(CURL*) {}
inline CURLcode curl_easy_setopt(CURL*, CURLoption, ...) { return CURLE_OK; }
inline CURLcode curl_easy_perform(CURL*) { return CURLE_OK; }
inline CURLcode curl_easy_getinfo(CURL*, CURLINFO, ...) { return CURLE_OK; }
inline char* curl_easy_escape(CURL*, const char* str, int) { return strdup(str); }
inline void curl_free(void* p) { free(p); }
inline struct curl_slist* curl_slist_append(struct curl_slist* list, const char* str) {
    struct curl_slist* item = (struct curl_slist*)malloc(sizeof(struct curl_slist));
    item->data = strdup(str);
    item->next = list;
    return item;
}
inline void curl_slist_free_all(struct curl_slist* list) {
    while (list) {
        struct curl_slist* next = list->next;
        free(list->data);
        free(list);
        list = next;
    }
}

#endif
