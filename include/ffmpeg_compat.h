#pragma once

#ifndef DUSTPLAY_WIN32

extern "C" {
#include <libavcodec/avcodec.h>
#include <libavformat/avformat.h>
#include <libavfilter/avfilter.h>
#include <libavfilter/buffersink.h>
#include <libavfilter/buffersrc.h>
#include <libavutil/opt.h>
#include <libavutil/imgutils.h>
#include <libavutil/rational.h>
#include <libswscale/swscale.h>
}

#else

#include <cstdint>
#include <cstddef>
#include <cstring>


#define AV_TIME_BASE 1000000
#define AV_NOPTS_VALUE (-9223372036854775807LL - 1)
#define AVSEEK_FLAG_BACKWARD 1
#define AVIO_FLAG_WRITE 2
#define AVMEDIA_TYPE_VIDEO 0
#define AVMEDIA_TYPE_AUDIO 1
#define AVFMT_NOFILE 0x0001

struct AVRational {
    int num;
    int den;
};

struct AVCodecParameters {
    int codec_type;
    int width;
    int height;
    int codec_tag;
};

#define AV_PKT_FLAG_KEY 0x0001

struct AVStream {
    int index;
    AVCodecParameters* codecpar;
    AVRational r_frame_rate;
    AVRational time_base;
};

struct AVOutputFormat {
    int flags;
};

struct AVFormatContext {
    int64_t duration;
    unsigned int nb_streams;
    AVStream** streams;
    AVOutputFormat* oformat;
    void* pb;
    void* metadata;
};


#define AV_CODEC_ID_AAC 86018
#define AV_SAMPLE_FMT_FLTP 8

struct AVChannelLayout {};

struct AVCodec {
    const char* name;
};

struct AVCodecContext {
    int width;
    int height;
    int sample_rate;
    int sample_fmt;
    int64_t bit_rate;
    int frame_size;
    int gop_size;
    int max_b_frames;
    void* priv_data;
    AVChannelLayout ch_layout;
    AVRational time_base;
    AVRational framerate;
    int pix_fmt;
};

struct AVFrame {
    int width;
    int height;
    int format;
    int nb_samples;
    int sample_rate;
    int64_t pts;
    uint8_t* data[8];
    int linesize[8];
    AVChannelLayout ch_layout;
};

inline const AVCodec* avcodec_find_encoder(int) { return nullptr; }
inline const AVCodec* avcodec_find_encoder_by_name(const char*) { return nullptr; }
inline void av_channel_layout_default(AVChannelLayout*, int) {}
inline void av_channel_layout_copy(AVChannelLayout*, const AVChannelLayout*) {}
inline int av_frame_make_writable(AVFrame*) { return 0; }



struct AVPacket {
    int stream_index;
    int64_t pts;
    int64_t dts;
    int64_t duration;
    int flags;
    int size;
    uint8_t* data;
    int64_t pos;
};

struct SwsContext {};

// Inline stubs for Windows cross-build compatibility
inline AVPacket* av_packet_clone(const AVPacket*) { return new AVPacket(); }
inline int av_dict_set(void**, const char*, const char*, int) { return 0; }


// Inline stubs for Windows cross-build compatibility
inline int avformat_open_input(AVFormatContext**, const char*, void*, void*) { return -1; }
inline int avformat_find_stream_info(AVFormatContext*, void*) { return -1; }
inline void avformat_close_input(AVFormatContext**) {}
inline int avformat_alloc_output_context2(AVFormatContext**, const char*, const char*, const char*) { return -1; }
inline AVStream* avformat_new_stream(AVFormatContext*, void*) { return nullptr; }
inline int avcodec_parameters_copy(AVCodecParameters*, const AVCodecParameters*) { return 0; }
inline int avio_open(void**, const char*, int) { return -1; }
inline void avio_closep(void**) {}
inline void avformat_free_context(AVFormatContext*) {}
inline int avformat_write_header(AVFormatContext*, void*) { return -1; }
inline void av_seek_frame(AVFormatContext*, int, int64_t, int) {}
inline AVPacket* av_packet_alloc() { return nullptr; }
inline int av_read_frame(AVFormatContext*, AVPacket*) { return -1; }
inline void av_packet_unref(AVPacket*) {}
inline void av_packet_free(AVPacket**) {}
inline int64_t av_rescale_q(int64_t a, AVRational b, AVRational c) { return a; }
inline void av_packet_rescale_ts(AVPacket*, AVRational, AVRational) {}
inline int av_interleaved_write_frame(AVFormatContext*, AVPacket*) { return -1; }
inline int av_write_trailer(AVFormatContext*) { return 0; }
#define AV_PIX_FMT_YUV420P 0
#define AV_PIX_FMT_BGRA 30
#define SWS_FAST_BILINEAR 1
#define EAGAIN 11
#define AVERROR(e) (-(e))
#define AVERROR_EOF (-541478705)

typedef int AVPixelFormat;

inline AVCodecParameters* avcodec_parameters_alloc() { return new AVCodecParameters(); }
inline void avcodec_parameters_free(AVCodecParameters** p) { if (p && *p) { delete *p; *p = nullptr; } }
inline void sws_freeContext(SwsContext*) {}
inline void avcodec_free_context(AVCodecContext** c) { if (c && *c) { delete *c; *c = nullptr; } }
inline AVCodecContext* avcodec_alloc_context3(const AVCodec*) { return nullptr; }

inline int av_opt_set(void*, const char*, const char*, int) { return 0; }
inline int av_opt_set_int(void*, const char*, int64_t, int) { return 0; }
inline int avcodec_open2(AVCodecContext*, const AVCodec*, void*) { return -1; }
inline int avcodec_parameters_from_context(AVCodecParameters*, const AVCodecContext*) { return 0; }
inline int av_frame_copy(AVFrame*, const AVFrame*) { return 0; }
inline SwsContext* sws_getContext(int, int, AVPixelFormat, int, int, AVPixelFormat, int, void*, void*, void*) { return nullptr; }
inline int sws_scale(SwsContext*, const uint8_t* const[], const int[], int, int, uint8_t* const[], const int[]) { return 0; }
inline int avcodec_send_frame(AVCodecContext*, const AVFrame*) { return -1; }
inline int avcodec_receive_packet(AVCodecContext*, AVPacket*) { return -1; }



inline AVFrame* av_frame_alloc() {
    AVFrame* f = new AVFrame();
    memset(f, 0, sizeof(AVFrame));
    f->data[0] = new uint8_t[1920 * 1080 * 4]();
    f->data[1] = new uint8_t[1920 * 1080]();
    f->data[2] = new uint8_t[1920 * 1080]();
    f->linesize[0] = 1920 * 4;
    f->linesize[1] = 1920;
    f->linesize[2] = 1920;
    return f;
}
inline int av_frame_get_buffer(AVFrame*, int) { return 0; }
inline void av_frame_free(AVFrame** f) {
    if (f && *f) {
        delete[] (*f)->data[0];
        delete[] (*f)->data[1];
        delete[] (*f)->data[2];
        delete *f;
        *f = nullptr;
    }
}
inline void av_free(void*) {}



#endif
